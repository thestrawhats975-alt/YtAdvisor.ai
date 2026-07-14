package com.YtAdvisor.backend.configurations;

/*
 * This file is intentionally left as a no-op class.
 *
 * WHY IT WAS REMOVED:
 * The original @Configuration + @Bean(initMethod = "migrate") caused Flyway
 * to run migrations TWICE on startup:
 *   1. Via this custom bean's initMethod
 *   2. Via Spring Boot's own FlywayAutoConfiguration (triggered by spring.flyway.enabled=true)
 *
 * This created a race condition on the flyway_schema_history lock table at boot time.
 *
 * FIX:
 * Flyway is now fully managed by Spring Boot's autoconfiguration. All settings
 * (locations, baselineOnMigrate, validateOnMigrate, etc.) are configured through
 * application.properties using the spring.flyway.* namespace — no code needed.
 *
 * To add or tune Flyway behaviour, edit application.properties:
 *   spring.flyway.enabled=true
 *   spring.flyway.locations=classpath:db/migration
 *   spring.flyway.baseline-on-migrate=false
 *   spring.flyway.validate-on-migrate=true
 */
public class FlywayConfig {
    // Intentionally empty — Spring Boot autoconfiguration handles Flyway.
}
