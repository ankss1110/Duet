import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import duetsRouter from "./duets";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(duetsRouter);

export default router;
