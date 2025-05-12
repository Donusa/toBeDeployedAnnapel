FROM openjdk:17-jdk-slim
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} monolith-0.0.1.jar
EXPOSE 9000
ENTRYPOINT [ "java","-jar","/monolith-0.0.1.jar" ]