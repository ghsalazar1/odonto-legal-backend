const UserDTO = require('./user.dto');

class PaginatedUserResponseDTO {
  constructor({ data, total, page, limit }) {
    this.data = data.map(user => new UserDTO(user));
    this.meta = {
      total,
      page,
      limit,
    };
  }
}

module.exports = PaginatedUserResponseDTO;
