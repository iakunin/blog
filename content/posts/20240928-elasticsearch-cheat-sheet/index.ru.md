---
title: Шпаргалка по поисковым запросам ElasticSearch 
slug: elasticsearch-cheat-sheet 
date: 2024-09-28
description: На одной странице представлены основные поисковые запросы ElasticSearch, которые
  приходится каждый раз гуглить и тратить на это время  
tags:
  - elastic-search
  - cheat-sheet
draft: true
---

Каждый раз как мне нужно написать поисковый запрос к ElasticSearch, я открываю Гугл. Вот
отказывается мой мозг запомнить структуру этих запросов. Я решил, что хватит это терпеть -- нужно
написать пост-шпаргалку. Во-первых, вся информация будет находиться на одной странице, что
сократит время на поиски в интернетах. А, во-вторых, есть шанс, что мой мозг при написании поста
запомнит слегка большее количество информации.  
Буду рад, если эта шпаргалка окажется кому-то полезной.
<!--more-->


### Фильтрация

Фильтрация по наличию поля `diff` в документе:
```json
{
    "query": {
        "exists": {
            "field": "diff"
        }
    }
}
```

Фильтрация по диапазону поля `created_at`:
```json
{
    "query": {
        "range": {
            "created_at": {
                "gt": 1632749040000,
                "lt": 1632749050000
            }
        }
    }
}
```

Фильтрация по нескольким условиям через логическое И (AND):
```json
{
    "query": {
        "bool": {
            "must": [
                {
                    "exists": {
                        "field": "diff"
                    }
                },
                {
                    "range": {
                        "created_at": {
                            "gt": 1632749040000,
                            "lt": 1632749050000
                        }
                    }
                }
            ]
        }
    }
}
```

Фильтрация по нескольким условиям через логическое ИЛИ (OR):
```json
{
    "query": {
        "bool": {
            "should": [
                {
                    "exists": {
                        "field": "diff"
                    }
                },
                {
                    "range": {
                        "created_at": {
                            "gt": 1632749040000,
                            "lt": 1632749050000
                        }
                    }
                }
            ]
        }
    }
}
```

<br/>

---
---
---

<br/>

### Агрегация
[Максимальное значение][max] поля `id`:
```json
{
    "size": 0,
    "aggs": {
        "<aggregation_result_name>": {
            "max": {
                "field": "id"
            }
        }
    }
}
```

[Статистика][stat] числового поля `diff`:
```json
{
    "size": 0,
    "aggs": {
        "<aggregation_result_name>": {
            "stats": {
                "field": "diff"
            }
        }
    }
}
```

[Перцентили][percentiles] числового поля `diff`:
```json
{
    "size": 0,
    "aggs": {
        "<aggregation_result_name>": {
            "percentiles": {
                "field": "diff"
            }
        }
    }
}
```

[max]: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-max-aggregation.html
[stat]: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-stats-aggregation.html
[percentiles]: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-percentile-aggregation.html
