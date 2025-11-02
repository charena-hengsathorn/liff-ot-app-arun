/**
 * Customize Strapi's Users & Permissions plugin (TypeScript version)
 * Makes email optional in User model
 */

export default (plugin: any) => {
  // Make email field optional in User model
  const userSchema = plugin.contentTypes.user.schema;

  // Update email field to be optional
  if (userSchema.attributes.email) {
    // Remove required validation
    userSchema.attributes.email = {
      ...userSchema.attributes.email,
      required: false,
    };
  }

  return plugin;
};

