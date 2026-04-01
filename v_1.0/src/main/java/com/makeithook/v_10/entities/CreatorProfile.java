// package com.makeithook.v_10.entities;

// import jakarta.persistence.*;
// import lombok.Data;
// import java.util.List;
// import java.util.UUID;

// @Entity
// @Data
// @Table(name = "creator_profiles")
// public class CreatorProfile {

//     @Id
//     @GeneratedValue(strategy = GenerationType.UUID)
//     private UUID id;

//     private String userId; // Links to your auth system
//     private String channelId;
//     private String niche;
//     private Integer subscriberCount;

//     @ElementCollection
//     @CollectionTable(name = "creator_strengths", joinColumns = @JoinColumn(name = "profile_id"))
//     @Column(name = "strength")
//     private List<String> strengths;

//     @ElementCollection
//     @CollectionTable(name = "creator_weaknesses", joinColumns = @JoinColumn(name = "profile_id"))
//     @Column(name = "weakness")
//     private List<String> weaknesses;

//     @ElementCollection
//     @CollectionTable(name = "creator_interests", joinColumns = @JoinColumn(name = "profile_id"))
//     @Column(name = "interest")
//     private List<String> interests;

//     @OneToMany(mappedBy = "creatorProfile", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
//     private List<PastVideo> recentVideos;
// }