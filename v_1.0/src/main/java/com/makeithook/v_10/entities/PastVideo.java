// package com.makeithook.v_10.entities;

// import java.util.UUID;

// import jakarta.persistence.Entity;
// import jakarta.persistence.GeneratedValue;
// import jakarta.persistence.GenerationType;
// import jakarta.persistence.Id;
// import jakarta.persistence.JoinColumn;
// import jakarta.persistence.ManyToOne;
// import jakarta.persistence.Table;
// import lombok.Data;

// @Entity
// @Data
// @Table(name = "past_videos")
// public class PastVideo {

//     @Id
//     @GeneratedValue(strategy = GenerationType.UUID)
//     private UUID id;

//     @ManyToOne
//     @JoinColumn(name = "profile_id")
//     private CreatorProfile creatorProfile;

//     private String title;
//     private Integer views;
//     private String format;
// }
