FROM debezium/connect:1.6

ARG JMX_AGENT_VERSION=0.16.1
ARG METRICS_PORT=8080

# Downloading jmx_prometheus_javaagent
RUN mkdir -p $KAFKA_HOME/etc && cd $KAFKA_HOME/etc && \
    curl -so jmx_prometheus_javaagent.jar \
    https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/$JMX_AGENT_VERSION/jmx_prometheus_javaagent-$JMX_AGENT_VERSION.jar

# Downloading example config for jmx_prometheus_javaagent
RUN cd $KAFKA_HOME/etc && \
    curl -so metrics-config.yml \
    https://raw.githubusercontent.com/debezium/debezium-examples/cf8eaf05f3259dc51c2f9316f6c14a3b39b185fb/monitoring/debezium-jmx-exporter/config.yml

# Adding `-javaagent` argument to KAFKA_OPTS (JAVA_OPTS of Kafka process)
ENV KAFKA_OPTS="-javaagent:$KAFKA_HOME/etc/jmx_prometheus_javaagent.jar=$METRICS_PORT:$KAFKA_HOME/etc/metrics-config.yml"
