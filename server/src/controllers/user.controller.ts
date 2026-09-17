import { getPaginationOptions, formatPagination } from "@utils/pagination.js";
import { userService } from "../services/user.service.js";
import type { UpdateUserInput } from "@schemas/user.schema.js";
import type { Request, Response } from "express";

export const getAllUsers = async (
  req: Request<unknown, unknown, unknown, { page?: string; limit?: string }>,
  res: Response,
) => {
  const { page, limit, skip } = getPaginationOptions(req.query.page, req.query.limit);
  const { users, totalResults } = await userService.findAll(skip, limit);

  res.status(200).json({
    status: "success",
    results: users.length,
    data: users,
    pagination: formatPagination(totalResults, page, limit),
  });
};

export const getOneUser = async (req: Request<{ id: string }>, res: Response) => {
  const user = await userService.findById(req.params.id);
  res.status(200).json({ status: "success", data: user });
};

export const getUserProfile = async (req: Request, res: Response) => {
  const user = await userService.findProfileByUserId(req.user.id);
  res.status(200).json({ status: "success", data: user });
};

export const deleteUser = async (req: Request<{ id: string }>, res: Response) => {
  await userService.deleteById(req.params.id);
  // 204 needs an empty body
  res.status(204).send();
};

export const updateMe = async (req: Request, res: Response) => {
  const updatedUser = await userService.updateByUserId(req.user.id, req.body as UpdateUserInput);
  res.status(200).json({ status: "success", data: updatedUser });
};
