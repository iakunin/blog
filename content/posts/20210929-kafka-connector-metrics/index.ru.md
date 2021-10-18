---
title: Настройка метрик для Debezium Kafka-коннектора
slug: debezium-kafka-connector-metrics
date: '2021-09-29'
description: Пошаговая инструкция, как настроить экспорт метрик в Prometheus для Debezium
  Kafka-коннектора
tags:
  - howto
---

В данной статье рассмотрим по шагам, как настроить экспорт метрик в [Prometheus][prom] для
[Debezium Kafka-коннектора][debezium].
<!--more-->

Вся настройка будет производиться в рамках кастомизации докер-образа. Итогом
настройки будет являться именно докер-образ, готовый для дальнейших манипуляций (в том числе и
деплоя в продакшен).


### Шаг 1. Выбираем базовый докер-образ
За базовый докер-образ возьмём `debezium/connect:1.6`.

Почему именно его? Всё просто: на момент написания статьи именно версия `1.6` является самой
свежей stable-версией.

```dockerfile
FROM debezium/connect:1.6
```

### Шаг 2. Экспортируем JMX Beans в Prometheus-формате
Официальная документация Debezium [утверждает][debezium-monitoring], что для мониторинга коннектора
можно использовать JMX. На самом деле, JMX Beans являются единственным доступным способом
мониторинга не только Kafka-коннекторов, но и Apache Zookeeper, а также непосредственно
Apache Kafka.

В документации Debezium предлагается настроить JMX через переменные окружения. Для экспорта метрик
в Prometheus это не является обязательным шагом. В нашем случае необходимо корректно установить и
настроить [JMX Exporter Java-агент][jmx-exporter].

В [README][jmx-exporter-readme] данного проекта настоятельно рекомендуется использовать его именно 
как Java-агент, но допускается также его установка как независимого http-сервера
(данный вариант не будет рассматриваться в рамках этой статьи).

### Шаг 2.1. Скачиваем JMX Exporter
Скачиваем JMX Exporter в директорию `$KAFKA_HOME/etc`:
```dockerfile
RUN mkdir $KAFKA_HOME/etc && cd $KAFKA_HOME/etc && \
    curl -so jmx_prometheus_javaagent.jar \
    https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.16.1/jmx_prometheus_javaagent-0.16.1.jar
```

### Шаг 2.2. Описываем конфигурацию для JMX Exporter
Конфигурация для JMX Exporter должна быть описана в YAML-формате. В качестве базовой конфигурации
возьмём [этот пример][jmx-exporter-config-example] из репозитория `debezium-examples`:
```dockerfile
RUN cd $KAFKA_HOME/etc && \
    curl -so metrics-config.yml \
    https://raw.githubusercontent.com/debezium/debezium-examples/cf8eaf05f3259dc51c2f9316f6c14a3b39b185fb/monitoring/debezium-jmx-exporter/config.yml
```

Более подробное описание всех конфигурационных опций можно найти в [соответствующем разделе README
`prometheus/jmx_exporter`][jmx-exporter-config-readme].

### Шаг 2.3. Прописываем опцию `javaagent` для коннектора
Остаётся лишь собрать всё воедино, прописав опцию `javaagent` для Kafka-коннектора.
В этом нам поможет env-переменная `KAFKA_OPTS`, которая используется для установки всех
JVM-параметров java-процесса Kafka-коннектора:
```dockerfile
ARG METRICS_PORT=8080
ENV KAFKA_OPTS="-javaagent:$KAFKA_HOME/etc/jmx_prometheus_javaagent.jar=$METRICS_PORT:$KAFKA_HOME/etc/metrics-config.yml"
```

Если опция `javaagent` установлена корректно, то метрики должны быть доступны внутри
докер-контейнера по адресу `http://localhost:8080/metrics`.

Чуть ниже мы убедимся в этом на практике.


### Итоговый Dockerfile
На протяжении статьи мы строчка за строчкой разбирали структуру Dockerfile для Kafka-коннектора.
Если собрать их воедино, то получившийся Dockerfile будет выглядеть следующим образом:
{{% includeCode file="code/Dockerfile" language="dockerfile" %}}


### Убеждаемся в корректности результата

Если мы попытаемся запустить получившийся докер-образ, то мы получим ошибку следующего вида:
```text
Connection to node -1 (/0.0.0.0:9092) could not be established.
Broker may not be available.
```

Для того чтобы исправить эту ошибку, нам необходимо поднять контейнер с Apache Kafka, который
в свою очередь, потребует Apache Zookeeper.

Здесь нам на помощь придёт `docker-compose`, который упростит нам работу с данным набором 
докер-контейнеров. Я подготовил файл `docker-compose.yml`, в котором описал минимальную
конфигурацию, необходимую для старта локального Kafka-коннектора:
{{% includeCode file="code/docker-compose.yml" language="yml" %}}

Этот файл `docker-compose.yml` требуется положить рядом с файлом `Dockerfile`, описанным выше.

Было бы очень удобно взять и запустить всю эту связку при помощи одной команды. Сказано -- сделано!

Для того чтобы запустить приведённые ниже примеры кода, на вашем компьютере должны быть установлены:
* [curl][curl],
* [docker][docker],
* [docker-compose][docker-compose].

Описание того, что делает приведённая ниже комбо-команда:
* создаёт временную папку и переходит в неё,
* скачивает файлы `docker-compose.yml` и `Dockerfile`,
* поднимает все сервисы, объявленные в `docker-compose.yml`
  (в т.ч. собирает докер-образ из Dockerfile),
* ждёт 60 секунд, пока debezium-connector станет доступен на localhost:8080,
* и наконец выполняет команду, которая выводит в консоль метрики в Prometheus-формате,
* после чего останавливает все докер-контейнеры вне зависимости от успешности выполнения предыдущих
  команд.

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


Результирующий вывод этой команды должен получиться 
[примерно таким]({{< refToFile path="code/stdout.txt" >}}).

Если stdout в вашей консоли похож на него, то я вас не обманул и абсолютно правильно настроил
метрики для Kafka-коннектора Debezium. Если же что-то пошло не так, то дайте мне знать об этом 
(мои контакты вы можете найти в шапке сайта).



[prom]: https://prometheus.io/
[debezium]: https://debezium.io/
[debezium-monitoring]: https://debezium.io/documentation/reference/1.6/operations/monitoring.html
[jmx-exporter]: https://github.com/prometheus/jmx_exporter
[jmx-exporter-readme]: https://github.com/prometheus/jmx_exporter/blob/master/README.md
[jmx-exporter-config-example]: https://github.com/debezium/debezium-examples/blob/cf8eaf05f3259dc51c2f9316f6c14a3b39b185fb/monitoring/debezium-jmx-exporter/config.yml
[jmx-exporter-config-readme]: https://github.com/prometheus/jmx_exporter/blob/ea03179c8691d5220813402fb29901d3c61a7c48/README.md#configuration
[curl]: https://help.ubidots.com/en/articles/2165289-learn-how-to-install-run-curl-on-windows-macosx-linux
[docker]: https://docs.docker.com/engine/install/
[docker-compose]: https://docs.docker.com/compose/install/
[wait-for-it-sh]: https://github.com/vishnubob/wait-for-it
