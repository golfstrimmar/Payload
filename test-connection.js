// test-db.js
import pg from 'pg'
const { Client } = pg

const client = new Client({
  connectionString:
    'postgres://neondb_owner:npg_z2ounjdgw1VR@ep-muddy-bush-a2p0oihx-pooler.eu-central-1.aws.neon.tech/golfstrimmar?sslmode=require',
  ssl: {
    rejectUnauthorized: false, // Важно для Neon!
  },
  connectionTimeoutMillis: 5000, // Таймаут подключения 5 сек
  idleTimeoutMillis: 10000, // Таймаут простоя 10 сек
})

async function testConnection() {
  try {
    console.log('Попытка подключения к Neon...')
    await client.connect()

    const res = await client.query('SELECT NOW() as current_time, version() as pg_version')
    console.log('✅ Подключение успешно!')
    console.log('Текущее время в БД:', res.rows[0].current_time)
    console.log('Версия PostgreSQL:', res.rows[0].pg_version)

    // Дополнительная проверка таблиц
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    console.log(
      '\nТаблицы в базе:',
      tables.rows.map((r) => r.table_name),
    )
  } catch (error) {
    console.error('❌ Ошибка подключения:')
    console.error('- Код:', error.code)
    console.error('- Сообщение:', error.message)
    console.error('- Адрес:', error.address, 'Порт:', error.port)

    if (error.code === 'ECONNREFUSED') {
      console.log('\nПроверьте:')
      console.log('1. Доступность Neon (https://console.neon.tech)')
      console.log('2. Whitelist IP в настройках Neon')
      console.log('3. Не блокирует ли соединение брандмауэр/VPN')
    }
  } finally {
    await client.end()
    console.log('\nПодключение закрыто')
  }
}

// Запуск теста
testConnection()
