const db = require('../config/db');
const crypto = require('crypto');

// Fungsi untuk memverifikasi password yang dimasukkan dengan yang tersimpan
const verifyPassword = (password, storedHash) => {
    const [algorithm, iterations, salt, hash] = storedHash.split('$');
    const iterationsCount = parseInt(iterations, 10);

    const saltString = salt;

     // Menggunakan pbkdf2Sync untuk menghasilkan hash dari password yang dimasukkan
    const hashedBuffer = crypto.pbkdf2Sync(
        password,
        saltString,
        iterationsCount,
        32, 
        'sha256'
    );

    // Membandingkan hash yang dihitung dengan yang tersimpan
    const hashedPassword = hashedBuffer.toString('base64');

    return hashedPassword === hash;
};

const login = async (request, h) => {
    const { username, password } = request.payload;

    try {
        const result = await db.execute(
            'SELECT id, username, first_name, last_name, password, is_active, last_login FROM auth_user WHERE username = ?',
            [username]
        );

        const rows = result[0] && Array.isArray(result[0]) ? result[0] : [];

        if (rows.length === 0) {
            return h.response({ message: 'User not found' }).code(404);
        }

        const user = rows[0];

        if (!user.is_active) {
            return h.response({ message: 'Account is not active' }).code(403);
        }

        const passwordMatch = verifyPassword(password, user.password);
        if (!passwordMatch) {
            return h.response({ message: 'Invalid password' }).code(401);
        }

        const roleResult = await db.execute(
            `SELECT g.name as role 
             FROM auth_user_groups ug 
             JOIN auth_group g ON ug.group_id = g.id 
             WHERE ug.user_id = ?`,
            [user.id]
        );

        const roleRows = roleResult[0] && Array.isArray(roleResult[0]) ? roleResult[0] : [];

        const role = roleRows.length > 0 ? roleRows[0].role : 'Unknown';

        await db.execute(
            'UPDATE auth_user SET last_login = NOW(6) WHERE id = ?',
            [user.id]
        );
        const fullName = `${user.first_name} ${user.last_name}`;

        return h.response({ success: true, userId: user.id, username: username, name: fullName, role: role }).code(200);
    } catch (error) {
        console.error(error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};

module.exports = { login };
