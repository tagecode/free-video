import { favoritesService } from '../../services/favorites-service'
import { fetchVideoTitle } from '../../services/video-title'
import { handle } from '../register'

export function registerFavoriteHandlers(): void {
  handle('favorites:list', () => favoritesService.list())
  handle('favorites:add', async (input) => {
    const title = input.title.trim() || (await fetchVideoTitle(input.videoUrl))
    return favoritesService.add({ ...input, title })
  })
  handle('favorites:update-note', (id, note) => favoritesService.updateNote(id, note))
  handle('favorites:fill-titles', () => favoritesService.fillTitles())
  handle('favorites:remove', (id) => favoritesService.remove(id))
}
