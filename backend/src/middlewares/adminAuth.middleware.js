const verifyAdmin = (req, res, next) => {
    if (!req.user || (parseInt(req.user.rol_id) !== 1 && parseInt(req.user.role) !== 1)) {
        return res.status(403).json({ 
            error: true, 
            message: 'Acceso Denegado: Se requiere el rol de Administrador para realizar esta acción o consultar esta información.' 
        });
    }
    next();
};

module.exports = verifyAdmin;
