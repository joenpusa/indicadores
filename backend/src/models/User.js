class User {
    constructor({ id_usuario, email, nombre, rol_id, es_activo, id_secretaria, password, requiere_cambio_clave, created_at, nombre_rol, tipo_permiso, nombre_secretaria }) {
        this.id_usuario = id_usuario;
        this.email = email;
        this.nombre = nombre;
        this.rol_id = rol_id;
        this.es_activo = es_activo;
        this.id_secretaria = id_secretaria;
        this.password = password;
        this.requiere_cambio_clave = requiere_cambio_clave;
        this.created_at = created_at;
        this.nombre_rol = nombre_rol;
        this.tipo_permiso = tipo_permiso;
        this.nombre_secretaria = nombre_secretaria;
    }
}

module.exports = User;
