/**
 * driver controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::driver.driver', ({ strapi }) => ({
  /**
   * Custom delete method that removes associated attendance records first
   */
  async delete(ctx) {
    const { id } = ctx.params;

    try {
      // First, find and delete all attendance records associated with this driver
      const attendances = await strapi.db.query('api::attendance.attendance').findMany({
        where: { driver: id },
      });

      if (attendances && attendances.length > 0) {
        // Delete all attendance records
        await Promise.all(
          attendances.map(attendance =>
            strapi.db.query('api::attendance.attendance').delete({
              where: { id: attendance.id },
            })
          )
        );
      }

      // Then delete the driver using the default method
      const response = await super.delete(ctx);
      return response;
    } catch (error) {
      ctx.throw(500, error);
    }
  },
}));

