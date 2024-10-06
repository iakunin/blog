---
title: ElasticSearch queries cheat sheet
slug: elasticsearch-cheat-sheet 
date: 2024-09-28
description: On one page, the main ElasticSearch queries are presented, which often need to be 
  googled repeatedly, wasting time  
tags:
  - elastic-search
  - cheat-sheet
---

Every time I need to write a query for ElasticSearch, I turn to Google. My brain just refuses to
remember the structure of these queries. I decided it's time to stop this and create a cheat 
sheet post. First, all the information will be on one page, reducing search time online.
Second, writing the post might help me remember more.
I hope this cheat sheet will be useful to others.
<!--more-->


### Filtering
Filtering by the presence of the `diff` field in the document:
```json
{
    "query": {
        "exists": {
            "field": "diff"
        }
    }
}
```

Filtering by the range of the `created_at` field:
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

Filtering by multiple conditions via logical AND:
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

Filtering by multiple conditions via logical OR:
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

### Aggregations
[Maximum value][max] of the `id` field:
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

[Statistics][stat] of the numeric field `diff`:
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

[Percentiles][percentiles] of the numeric field `diff`:
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
