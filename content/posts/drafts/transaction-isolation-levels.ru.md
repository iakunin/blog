---
draft: true
title: Уровни изоляции транзакций
slug: transaction-isolation-levels
description: '@TODO'
---




Пример для понимания самого первого уровня изоляции READ UNCOMMITTED:
```sql
UPDATE balance SET amount = amount + 100;
```

-------

Суть REPEATABLE READ (проблема неповторяющегося чтения):
Считываешь много раз одно и то же и оно мутирует, хотя в каких-то кейсах на должно.


-----------

### Пример Non-repeatable read

Пример взят из видео https://www.youtube.com/watch?v=xR70UlE_xbo

```sql
BEGIN;
    SELECT SUM(Revenue) as Total FROM Data;
    -- another transaction _updates_ a row
    SELECT Revenue as Detail From Data;
COMMIT;
```



-----------

### Пример Phantom

Пример взят из видео https://www.youtube.com/watch?v=xR70UlE_xbo

```sql
BEGIN;
    SELECT SUM(Revenue) as Total FROM Data;
    -- another transaction _inserts_ a row
    SELECT Revenue as Detail From Data;
COMMIT;
```


-------------


Возможные варианты улучшения блогпоста:
1. Реальные жизненные примеры
2. Изоляции уровень nightmare
