import { Router } from 'express';
import * as movieController from './movieController.js';

const router = Router();

router.get('/', movieController.list);
router.get('/:id', movieController.getById);
router.post('/', movieController.create);
router.put('/:id', movieController.update);
router.delete('/:id', movieController.remove);

export default router;
