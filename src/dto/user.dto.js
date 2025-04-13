const RoleDTO = require('./role.dto');

class UserDTO {
  constructor({ id, email, name, role }) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.role = role ? new RoleDTO(role) : null;
  }
}

module.exports = UserDTO;