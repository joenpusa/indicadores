class User {
    constructor({ id_usuario, email, nombre, rol_id, es_activo, id_secretaria, password, requiere_cambio_clave, created_at }) {
        this.id_usuario = id_usuario;
        this.email = email;
        this.nombre = nombre;
        this.rol_id = rol_id;
        this.es_activo = es_activo;
        this.id_secretaria = id_secretaria;
        this.password = password;
        this.requiere_cambio_clave = requiere_cambio_clave;
        this.created_at = created_at;
    }
}

module.exports = User;
