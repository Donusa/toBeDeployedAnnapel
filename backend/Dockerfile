FROM openjdk:17-jdk-slim
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} pel-0.0.1-SNAPSHOT.jar
EXPOSE 8080
ENTRYPOINT [ "java","-jar","/pel-0.0.1-SNAPSHOT.jar" ]