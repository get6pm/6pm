import { zCreateCategory, zUpdateCategory } from '@6pm/validation'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { getAuthUserStrict } from '../middlewares/auth'
import {
  canUserCreateCategory,
  canUserDeleteCategory,
  canUserReadCategory,
  canUserUpdateCategory,
  createCategory,
  deleteCategory,
  findCategoriesOfUser,
  findCategory,
  updateCategory,
} from '../services/category.service'

const router = new Hono()

  // get all categories of the current authenticated user
  .get('/', async (c) => {
    const user = getAuthUserStrict(c)

    const categories = await findCategoriesOfUser({ user })

    return c.json(categories)
  })

  // create a new category
  .post('/', zValidator('json', zCreateCategory), async (c) => {
    const user = getAuthUserStrict(c)

    if (!(await canUserCreateCategory({ user }))) {
      return c.json({ message: 'user cannot create category' }, 403)
    }

    const createCategoryData = c.req.valid('json')

    const category = await createCategory({ user, data: createCategoryData })

    return c.json(category, 201)
  })

  // update a category
  .put(
    '/:categoryId',
    zValidator('param', z.object({ categoryId: z.string() })),
    zValidator('json', zUpdateCategory),
    async (c) => {
      const user = getAuthUserStrict(c)
      const { categoryId } = c.req.valid('param')

      const category = await findCategory({ id: categoryId })

      if (!(category && (await canUserReadCategory({ user, category })))) {
        return c.json({ message: 'category not found' }, 404)
      }

      if (!(await canUserUpdateCategory({ user, category }))) {
        return c.json({ message: 'user cannot update category' }, 403)
      }

      const updateCategoryData = c.req.valid('json')

      const updatedCategory = await updateCategory({
        category,
        data: updateCategoryData,
      })

      return c.json(updatedCategory)
    },
  )

  // delete category
  .delete(
    '/:categoryId',
    zValidator('param', z.object({ categoryId: z.string() })),
    async (c) => {
      const user = getAuthUserStrict(c)
      const { categoryId } = c.req.valid('param')

      const category = await findCategory({ id: categoryId })

      if (!(category && (await canUserReadCategory({ user, category })))) {
        return c.json({ message: 'category not found' }, 404)
      }

      if (!(await canUserDeleteCategory({ user, category }))) {
        return c.json({ message: 'user cannot delete category' }, 403)
      }

      await deleteCategory({ categoryId })

      return c.json(category)
    },
  )

export default router
