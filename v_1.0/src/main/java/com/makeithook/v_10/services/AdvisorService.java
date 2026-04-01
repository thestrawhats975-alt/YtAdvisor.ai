// package com.makeithook.v_10.services;

// import java.util.stream.Collectors;

// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.stereotype.Service;
// import org.springframework.web.client.RestTemplate;

// import com.makeithook.v_10.dto.AgentPayload;
// import com.makeithook.v_10.dto.IdeaRequestDto;
// import com.makeithook.v_10.entities.CreatorProfile;
// import com.makeithook.v_10.repositories.CreatorProfileRepository;


// @Service
// public class AdvisorService {

//     private final CreatorProfileRepository profileRepository;
//     private final RestTemplate restTemplate;

//     @Value("${python.ai.url:http://localhost:8000/api/v1/analyze}")
//     private String pythonAiUrl;

//     public AdvisorService(CreatorProfileRepository profileRepository) {
//         this.profileRepository = profileRepository;
//         this.restTemplate = new RestTemplate();
//     }

//     public String getStrategy(IdeaRequestDto request) {
//         // 1. Fetch user profile
//         CreatorProfile profile = profileRepository.findByUserId(request.getUserId())
//                 .orElse(null);

//         // 2. Build Python Payload
//         AgentPayload payload = buildPayload(request, profile);

//         // 3. Fire to Python FastAPI
//         return restTemplate.postForObject(pythonAiUrl, payload, String.class);
//     }

//     private AgentPayload buildPayload(IdeaRequestDto request, CreatorProfile profile) {
//         AgentPayload.AgentPayloadBuilder payloadBuilder = AgentPayload.builder()
//                 .idea(request.getIdea())
//                 .content_mode(request.getContentMode());

//         if (profile != null) {
//             AgentPayload.ProfileDto profileDto = AgentPayload.ProfileDto.builder()
//                     .channel_id(profile.getChannelId())
//                     .niche(profile.getNiche())
//                     .subscriber_count(profile.getSubscriberCount())
//                     .strengths(profile.getStrengths())
//                     .weaknesses(profile.getWeaknesses())
//                     .interests(profile.getInterests())
//                     .recent_videos(profile.getRecentVideos().stream()
//                             .map(v -> AgentPayload.VideoDto.builder()
//                                     .title(v.getTitle())
//                                     .views(v.getViews())
//                                     .format(v.getFormat())
//                                     .build())
//                             .collect(Collectors.toList()))
//                     .build();
//             payloadBuilder.creator_profile(profileDto);
//         }

//         return payloadBuilder.build();
//     }
// }
