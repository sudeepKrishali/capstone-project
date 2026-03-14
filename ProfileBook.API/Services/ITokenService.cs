using ProfileBook.API.Models;

namespace ProfileBook.API.Services
{
    public interface ITokenService
    {
        string CreateToken(User user);
    }
}
