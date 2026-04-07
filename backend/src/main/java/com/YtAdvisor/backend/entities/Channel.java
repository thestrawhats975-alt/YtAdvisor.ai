package com.YtAdvisor.backend.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "channels")
@Getter
@Setter
public class Channel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "youtube_channel_id", nullable = false)
    private String youtubeChannelId;

    @Column(name = "channel_title")
    private String channelTitle;

    @Column(name = "subscriber_count")
    private Long subscriberCount = 0L;

    @Column(name = "total_video_count")
    private Integer totalVideoCount = 0;

    @CreationTimestamp
    @Column(name = "connected_at", updatable = false, nullable = false)
    private OffsetDateTime connectedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToOne(mappedBy = "channel", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private PipelineJob pipelineJob;

    @OneToMany(mappedBy = "channel", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DnaSnapshot> dnaSnapshots = new ArrayList<>();
}
