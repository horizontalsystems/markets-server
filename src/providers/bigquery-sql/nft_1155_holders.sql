with
tokens AS (
  SELECT *
  FROM UNNEST(@tokens)
),
transfers as (
  SELECT *
    FROM `blockchain-etl-internal.ethereum_common.All_event_TransferSingle_history`
    WHERE DATE(block_timestamp) <= DATE(CURRENT_DATE() - INTERVAL 1 DAY)
      AND DATE(block_timestamp) > @date_from
  UNION ALL
  SELECT *
    FROM `blockchain-etl-internal.ethereum_common.All_event_TransferSingle`
    WHERE DATE(block_timestamp) > DATE(CURRENT_DATE() - INTERVAL 1 DAY)
),
events as (
  select transfers.*, from transfers, tokens
   where contract_address = @contract
     and transfers.id = tokens.id
),
holders as (
  select
    id,
    address,
    sum(balance) as balance
  from (
    SELECT id, `from` address, -sum(safe_cast(value AS int64)) as balance
    FROM events
    GROUP by address, id
    UNION all
    SELECT id, `to` address, sum(safe_cast(value AS int64)) as balance
    FROM events
    GROUP by address, id
  )
  group by address, id
)
select * from holders
where balance > 0
