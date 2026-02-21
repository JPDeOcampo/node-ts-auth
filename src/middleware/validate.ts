import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

type ZodTreeNode = {
  errors: string[];
  properties?: Record<string, ZodTreeNode>;
};

/**
 * Convert Zod treeified errors into a flat object with dotted paths
 */

const extractFieldErrors = (
  tree: ZodTreeNode,
  prefix = "",
): Record<string, string[]> => {
  const result: Record<string, string[]> = {};

  if (tree.errors.length > 0) {
    const key = prefix || "_form"; // root-level errors
    result[key] = tree.errors;
  }

  if (tree.properties) {
    for (const [key, subtree] of Object.entries(tree.properties)) {
      const nested = extractFieldErrors(
        subtree,
        prefix ? `${prefix}.${key}` : key,
      );
      Object.assign(result, nested);
    }
  }

  return result;
}

export const validate =
  <T extends z.ZodTypeAny>(schema: T) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errorsTree = z.treeifyError(result.error);
      const fieldErrors = extractFieldErrors(errorsTree);

      res.status(400).json({
        message: "Validation failed",
        errors: fieldErrors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
