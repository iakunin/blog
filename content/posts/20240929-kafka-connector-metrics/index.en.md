---
title: Exporting Prometheus metrics from the Debezium Kafka connector
slug: debezium-kafka-connector-metrics
date: 2024-09-29
tags:
  - howto
  - metrics
  - prometheus
  - debezium
  - kafka-connector
---

In this article, we will take a step-by-step look at how to configure the [Debezium Kafka connector][debezium] so that it starts sending metrics in [Prometheus format][prom-format] over the HTTP protocol.

We will make the configuration by customizing the Docker image. At the end of the article we will get a Docker image ready for further manipulation (including deployment to production).

<!--more-->

## Before you start
In order to run the code examples given in the article, make sure that you have installed:
* [cURL][curl]
* [Docker][docker]
* [Docker Compose][docker-compose]

### Step 1. Select the basic Docker image
We use `debezium/connect:1.6` as the base Docker image.

Why this one? It's simple: version `1.6` is the most recent stable version at the time of writing.

```dockerfile
FROM debezium/connect:1.6
```

### Step 2. Export JMX Mbeans in Prometheus format
The official Debezium documentation [states][debezium-monitoring] that JMX can be used to monitor the connector. In fact, JMX Mbeans are the only available way to monitor not only Kafka connectors, but also Apache Zookeeper, as well as Apache Kafka itself.

The Debezium documentation suggests configuring JMX via environment variables. This is not a mandatory step for exporting metrics to Prometheus. In our case, it is necessary to correctly install and configure [JMS Exporter Java agent][jmx-exporter].

In the [README][jmx-exporter-readme] of this project, it is strongly recommended to use it specifically as a Java agent, but it is also allowed to install it as an independent http server (this option will not be considered in this article).

### Step 2.1. Download JMX Exporter
Download JMX Exporter to the directory `$KAFKA_HOME/etc`:
```dockerfile
RUN mkdir -p $KAFKA_HOME/etc && cd $KAFKA_HOME/etc && \
    curl -so jmx_prometheus_javaagent.jar \
    https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.16.1/jmx_prometheus_javaagent-0.16.1.jar
```

### Step 2.2. Describe the configuration for JMX Exporter
The configuration for JMX Exporter must be described in YAML format. As a basic configuration, let's take [this example][jmx-exporter-config-example] from the `debezium-examples` repository:
```dockerfile
RUN cd $KAFKA_HOME/etc && \
    curl -so metrics-config.yml \
    https://raw.githubusercontent.com/debezium/debezium-examples/cf8eaf05f3259dc51c2f9316f6c14a3b39b185fb/monitoring/debezium-jmx-exporter/config.yml
```

A more detailed description of all configuration options can be found in the [relevant README section][jmx-exporter-config-readme] of `prometheus/jmx_exporter` project.

### Step 2.3. Set the `javaagent` option for the connector
All that remains is to put everything together by specifying the `javaagent` option for the Kafka connector.
The environment variable `KAFKA_OPTS`, which is used to set all the JVM parameters of the java process of the Kafka connector, will help us in this:
```dockerfile
ARG METRICS_PORT=8080
ENV KAFKA_OPTS="-javaagent:$KAFKA_HOME/etc/jmx_prometheus_javaagent.jar=$METRICS_PORT:$KAFKA_HOME/etc/metrics-config.yml"
```

If the `javaagent` option is set correctly, then the metrics should be available inside the Docker container at `http://localhost:8080/metrics `.

Below we will see this in practice.


### The final Dockerfile
Throughout the article, we wrote the Dockerfile for the Kafka connector line by line.
If you put them together, the resulting Dockerfile will look like this:
{{% includeCode file="code/Dockerfile" language="dockerfile" %}}


### Check the correctness of the result

If we try to run the resulting Docker image, we will get the following error:
```text
Connection to node -1 (/0.0.0.0:9092) could not be established.
Broker may not be available.
```

In order to fix this error, we need to run a container with Apache Kafka.
In turn, Apache Kafka requires Apache Zookeeper for its work, which we will similarly run in a container.

Here, `docker-compose` will come to our aid, which will simplify our work with this set of Docker containers. I have prepared the `docker-compose.yml` file, in which I described the minimum configuration required to start the local Kafka connector:
{{% includeCode file="code/docker-compose.yml" language="yml" %}}

This `docker-compose.yml` file should be placed next to the `Dockerfile` file described above.

It would be very convenient to take and run this bunch with a single command. Said -- done!

Description of what the combo command below does:
* creates a temporary folder and goes to it,
* downloads the 'docker-compose' files.yml` and `Dockerfile`,
* launches all services declared in `docker-compose.yml`
  (including building a Docker image from a Dockerfile),
* waits 60 seconds for the debezium connector to become available on localhost:8080,
* and finally executes a command that outputs metrics in Prometheus format to the console,
* after that, it stops all Docker containers, regardless of the success of the previous instructions.

```shell
cd $(mktemp -d) && \
curl -sO {{< refToFile path="code/Dockerfile" >}} && \
curl -sO {{< refToFile path="code/docker-compose.yml" >}} && \
docker-compose up --build --detach && \
timeout 60 bash -c "while true; do if curl -I 'localhost:8080' 2>&1 | grep -wq 'HTTP/1.1 200 OK'; then exit 0; fi done" && \
echo "\n\n\n\n\n" && \
curl 'http://localhost:8080/metrics' && \
echo "\n\n\n\n\n" ; \
docker-compose down
```


The resulting output of this command should be
[something like this]({{< refToFile path="code/stdout.txt" >}}).

If the stdout in your console is similar to it, then I did not deceive you and set up the metrics for the Kafka Debezium connector absolutely correctly. If something went wrong, then let me know about it (you can find my contacts in the [site header](#social-icons)).



[prom-format]: https://prometheus.io/docs/instrumenting/exposition_formats/
[debezium]: https://debezium.io/
[debezium-monitoring]: https://debezium.io/documentation/reference/1.6/operations/monitoring.html
[jmx-exporter]: https://github.com/prometheus/jmx_exporter
[jmx-exporter-readme]: https://github.com/prometheus/jmx_exporter/blob/main/README.md
[jmx-exporter-config-example]: https://github.com/debezium/debezium-examples/blob/cf8eaf05f3259dc51c2f9316f6c14a3b39b185fb/monitoring/debezium-jmx-exporter/config.yml
[jmx-exporter-config-readme]: https://github.com/prometheus/jmx_exporter/blob/ea03179c8691d5220813402fb29901d3c61a7c48/README.md#configuration
[curl]: https://curl.se/download.html
[docker]: https://docs.docker.com/engine/install/
[docker-compose]: https://docs.docker.com/compose/install/
[wait-for-it-sh]: https://github.com/vishnubob/wait-for-it
