const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: 'root',
      database: 'gamedatadb'
    });

    console.log('✅ Connexion OK !');
    const [rows] = await connection.query('SHOW TABLES;');
    console.log('Tables :', rows);

    await connection.end();
  } catch (err) {
    console.error('❌ Erreur de connexion :', err.message);
  }
}

testConnection();
console.log('Fin du script');
