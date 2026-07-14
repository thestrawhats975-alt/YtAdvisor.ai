# ── Build Stage ──────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

# Set the working directory in the build container
WORKDIR /build

# Copy pom.xml first to resolve and cache dependencies
COPY pom.xml .

# Download dependencies (go-offline speeds up subsequent builds)
RUN mvn dependency:go-offline -B

# Copy the source code
COPY src ./src

# Build the application package, skipping tests (since they were removed)
RUN mvn package -DskipTests -B

# ── Run Stage ────────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

# Set environment variables
ENV PORT=8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:ActiveProcessorCount=1"

# Set the working directory in the run container
WORKDIR /app

# Copy the built jar file from the builder stage
COPY --from=builder /build/target/*.jar app.jar

# Expose port 8080 (Render default for web services)
EXPOSE 8080

# Execute the application, dynamically injecting runtime JAVA_OPTS and resolving PORT
CMD ["sh", "-c", "java ${JAVA_OPTS} -Dserver.port=${PORT:-8080} -jar app.jar"]
