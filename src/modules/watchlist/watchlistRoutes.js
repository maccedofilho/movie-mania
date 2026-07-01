import { Router } from 'express';
import * as watchlistController from './watchlistController.js';

const router = Router();

router.post('/', watchlistController.add);
router.put('/:id/watched', watchlistController.markAsWatched);
router.delete('/:id', watchlistController.remove);
router.get('/user/:userId', watchlistController.listByUser);

export default router;
