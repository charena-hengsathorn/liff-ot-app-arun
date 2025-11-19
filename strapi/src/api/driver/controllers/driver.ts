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
      console.log(`[Driver Delete] Starting delete for driver ID: ${id}`);

      // First, find all attendance records associated with this driver
      const attendances = await strapi.entityService.findMany('api::attendance.attendance', {
        filters: { driver: { id } },
        fields: ['id'],
      });

      console.log(`[Driver Delete] Found ${attendances?.length || 0} attendance records`);

      // Delete all attendance records
      if (attendances && attendances.length > 0) {
        for (const attendance of attendances) {
          await strapi.entityService.delete('api::attendance.attendance', attendance.id);
          console.log(`[Driver Delete] Deleted attendance ID: ${attendance.id}`);
        }
      }

      // Then delete the driver using the entity service
      const result = await strapi.entityService.delete('api::driver.driver', id);
      console.log(`[Driver Delete] Successfully deleted driver ID: ${id}`);

      return { data: result };
    } catch (error) {
      console.error('[Driver Delete] Error:', error);
      ctx.throw(500, `Failed to delete driver: ${error.message}`);
    }
  },
}));

