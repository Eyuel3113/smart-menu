import { Request, Response, NextFunction } from 'express';
import { MenuService } from '../services/menu.service';
import { sendSuccess } from '../utils/response';

export class MenuController {
  static async getPublicMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.query.restaurantId as string | undefined;
      const menu = await MenuService.getPublicMenu(restaurantId);
      return sendSuccess(res, menu, 'Public menu retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.staff?.restaurantId || (req.query.restaurantId as string);
      const categories = await MenuService.getCategories(restaurantId);
      return sendSuccess(res, categories, 'Categories retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.staff!.restaurantId;
      const { name, sortOrder } = req.body;
      const category = await MenuService.createCategory(restaurantId, name, sortOrder);
      return sendSuccess(res, category, 'Category created', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await MenuService.updateCategory(id, req.body);
      return sendSuccess(res, category, 'Category updated');
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await MenuService.deleteCategory(id);
      return sendSuccess(res, null, 'Category deleted');
    } catch (error) {
      next(error);
    }
  }

  static async getMenuItems(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.staff?.restaurantId || (req.query.restaurantId as string);
      const { categoryId, search, isAvailable } = req.query;

      const items = await MenuService.getMenuItems(restaurantId, {
        categoryId: categoryId as string,
        search: search as string,
        isAvailable: isAvailable !== undefined ? isAvailable === 'true' : undefined,
      });

      return sendSuccess(res, items, 'Menu items retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getMenuItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const item = await MenuService.getMenuItemById(id);
      return sendSuccess(res, item, 'Menu item retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.staff!.restaurantId;
      const item = await MenuService.createMenuItem(restaurantId, req.body);
      return sendSuccess(res, item, 'Menu item created', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const item = await MenuService.updateMenuItem(id, req.body);
      return sendSuccess(res, item, 'Menu item updated');
    } catch (error) {
      next(error);
    }
  }

  static async toggleAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const isAvailable = req.body?.isAvailable;
      const item = await MenuService.toggleAvailability(id, isAvailable);
      return sendSuccess(res, item, 'Availability updated');
    } catch (error) {
      next(error);
    }
  }

  static async deleteMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await MenuService.deleteMenuItem(id);
      return sendSuccess(res, null, 'Menu item deleted');
    } catch (error) {
      next(error);
    }
  }
}
