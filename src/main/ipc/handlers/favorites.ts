import { favoritesService } from '../../services/favorites-service'
import { handle } from '../register'

export function registerFavoriteHandlers(): void {
  handle('favorites:list', () => favoritesService.list())
  handle('favorites:add', (input) => favoritesService.add(input))
  handle('favorites:remove', (id) => favoritesService.remove(id))
}
