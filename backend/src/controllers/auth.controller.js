const bcrypt = require('bcrypt');
const UserDAO = require('../daos/UserDAO');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

class AuthController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: true, message: 'Email and password are required' });
            }

            const user = await UserDAO.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: true, message: 'Invalid credentials' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: true, message: 'Invalid credentials' });
            }

            if (user.es_activo === 0) {
                return res.status(403).json({ error: true, message: 'User is inactive' });
            }

            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);

            // In a real app, you might want to store the refresh token in the DB to allow revocation

            res.json({
                error: false,
                message: 'Login successful',
                data: {
                    accessToken,
                    refreshToken,
                    user: {
                        id: user.id_usuario,
                        email: user.email,
                        nombre: user.nombre,
                        rol_id: user.rol_id
                    }
                }
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: true, message: 'Server error' });
        }
    }

    static async refreshToken(req, res) {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ error: true, message: 'Refresh Token required' });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(403).json({ error: true, message: 'Invalid Refresh Token' });
        }

        try {
            const user = await UserDAO.findById(decoded.id);
            if (!user) {
                return res.status(403).json({ error: true, message: 'User not found' });
            }

            const newAccessToken = generateAccessToken(user);
            // Rotation of refresh token involves sending a new one and invalidating the old one. 
            // For simplicity, we just return a new access token here, or better yet, do full rotation.
            // Let's implement full rotation if we were storing in DB, but for stateless we just issue a new access token.
            // Actually, let's issue a new refresh token too to keep the sliding window alive if that's the policy, 
            // OR just keep the old one if it's still valid. Let's issue just access token for now to keep it simple.

            // Wait, standard practice often is: if refresh token is valid, issue new access + new refresh (Rotation).
            // Let's do that for better security.
            const newRefreshToken = generateRefreshToken(user);

            res.json({
                error: false,
                data: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: true, message: 'Server error' });
        }
    }

    // Helper for creating a user (e.g. initial seed or registration endpoint)
    static async register(req, res) {
        try {
            const { email, password, nombre, rol_id } = req.body;
            // Basic validation...

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const id = await UserDAO.create({
                email,
                nombre,
                rol_id,
                password: hashedPassword,
                es_activo: 1
            });

            res.status(201).json({ error: false, message: 'User created', data: { id } });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: true, message: 'Could not create user', details: err.message });
        }
    }
}

module.exports = AuthController;
