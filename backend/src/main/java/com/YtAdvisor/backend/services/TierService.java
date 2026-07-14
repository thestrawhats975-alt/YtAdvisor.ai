package com.YtAdvisor.backend.services;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.YtAdvisor.backend.entities.Subscription;
import com.YtAdvisor.backend.entities.User;
import com.YtAdvisor.backend.entities.UserAnalytics;
import com.YtAdvisor.backend.entities.UserTier;
import com.YtAdvisor.backend.repositories.SubscriptionRepository;
import com.YtAdvisor.backend.repositories.UserAnalyticsRepository;
import com.YtAdvisor.backend.repositories.UserRepository;

import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;

@Service
@RequiredArgsConstructor
@Slf4j
public class TierService {

    @Value("${app.free-limit:50}")
    private int freeLimit;

    @Value("${app.pro-limit:100}")
    private int proLimit;

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserAnalyticsRepository userAnalyticsRepository;

    /**
     * Called before every analysis. Resets weekly counter if needed,
     * checks the limit, increments the counter. Throws 429 if over limit.
     */
    @Transactional
    public void checkAndConsumeRequest(User user) {
        resetWeekIfNeeded(user);

        if (user.getTier() == UserTier.ULTIMATE) {
            // No limit — just increment for analytics
            user.setRequestsThisWeek(user.getRequestsThisWeek() + 1);
            userRepository.save(user);
            return;
        }

        int limit = user.getTier() == UserTier.PRO ? proLimit : freeLimit;

        if (user.getRequestsThisWeek() >= limit) {
            throw new ResponseStatusException(
                HttpStatus.TOO_MANY_REQUESTS,
                "Weekly limit of " + limit + " analyses reached for "
                    + user.getTier() + " plan. Resets on "
                    + user.getWeekResetAt().plusWeeks(1).toLocalDate()
            );
        }

        user.setRequestsThisWeek(user.getRequestsThisWeek() + 1);
        userRepository.save(user);
    }

    /**
     * Upgrades or downgrades a user's tier. Records the subscription event.
     */
    @Transactional
    public void changeTier(UUID userId, UserTier newTier, String paymentRef) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        UserTier oldTier = user.getTier();
        if (oldTier == newTier) return;

        // Close current active subscription if any
        subscriptionRepository
                .findTopByUser_IdAndEndedAtIsNullOrderByStartedAtDesc(userId)
                .ifPresent(sub -> {
                    sub.setEndedAt(OffsetDateTime.now());
                    subscriptionRepository.save(sub);
                });

        // Open new subscription
        Subscription sub = new Subscription();
        sub.setUser(user);
        sub.setTier(newTier);
        sub.setStartedAt(OffsetDateTime.now());
        sub.setPaymentRef(paymentRef);
        subscriptionRepository.save(sub);

        // Update user tier
        user.setTier(newTier);
        userRepository.save(user);

        // Update analytics
        UserAnalytics analytics = getOrCreateAnalytics(user);
        boolean isUpgrade = tierRank(newTier) > tierRank(oldTier);
        if (isUpgrade) {
            if (newTier == UserTier.PRO)      analytics.setTotalProActivations(analytics.getTotalProActivations() + 1);
            if (newTier == UserTier.ULTIMATE) analytics.setTotalUltimateActivations(analytics.getTotalUltimateActivations() + 1);
        } else {
            analytics.setTotalDowngrades(analytics.getTotalDowngrades() + 1);
        }
        userAnalyticsRepository.save(analytics);

        log.info("[tier] userId={} changed from {} to {}", userId, oldTier, newTier);
    }

    /**
     * Called from ChannelService after a channel is connected.
     */
    @Transactional
    public void recordChannelConnected(User user) {
        UserAnalytics analytics = getOrCreateAnalytics(user);
        if (analytics.getChannelConnectedAt() == null) {
            analytics.setChannelConnectedAt(OffsetDateTime.now());
            userAnalyticsRepository.save(analytics);
        }
    }

    /**
     * Called from PipelineStatusScheduler when a DNA snapshot becomes reliable.
     */
    @Transactional
    public void recordPipelineCompleted(User user) {
        UserAnalytics analytics = getOrCreateAnalytics(user);
        if (analytics.getPipelineCompletedAt() == null) {
            analytics.setPipelineCompletedAt(OffsetDateTime.now());
            userAnalyticsRepository.save(analytics);
        }
    }

    /**
     * Called from AnalysisService after a successful analysis.
     */
    @Transactional
    public void recordAnalysisRun(User user) {
        UserAnalytics analytics = getOrCreateAnalytics(user);
        analytics.setTotalAnalysesRun(analytics.getTotalAnalysesRun() + 1);
        if (analytics.getFirstAnalysisAt() == null) {
            analytics.setFirstAnalysisAt(OffsetDateTime.now());
        }
        analytics.setLastAnalysisAt(OffsetDateTime.now());
        userAnalyticsRepository.save(analytics);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void resetWeekIfNeeded(User user) {
        OffsetDateTime now = OffsetDateTime.now();
        if (now.isAfter(user.getWeekResetAt().plusWeeks(1))) {
            user.setRequestsThisWeek(0);
            user.setWeekResetAt(now);
            userRepository.save(user);
            log.info("[tier] weekly counter reset for userId={}", user.getId());
        }
    }

    private UserAnalytics getOrCreateAnalytics(User user) {
        return userAnalyticsRepository.findByUser_Id(user.getId())
                .orElseGet(() -> {
                    UserAnalytics a = new UserAnalytics();
                    a.setUser(user);
                    return userAnalyticsRepository.save(a);
                });
    }

    private int tierRank(UserTier tier) {
        return switch (tier) {
            case STARTER -> 0;
            case PRO -> 1;
            case ULTIMATE -> 2;
        };
    }
}
