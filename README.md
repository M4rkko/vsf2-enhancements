<div align="center">
<img src="https://res.cloudinary.com/vue-storefront/image/upload/v1710754524/Logo_green_2x_z4vmhz.png" height="80px"/>
</div>
# Alokai integration with Magento2

Repository is a starter Alokai application integrated with Magento2.

### Requirements:
- NodeJS >=14 <=16
- Yarn
- [Magento2](https://docs.magento.com/user-guide/)

### Where to start?

To get started, see the following guides:

- [Introduction](https://docs.vuestorefront.io/v2/getting-started/introduction.html) to learn what is Alokai

- [Configuring Magento2](https://docs.vuestorefront.io/magento/installation-setup/configure-magento.html) to setup your Magento2 store

- [Configuring Alokai](https://docs.vuestorefront.io/magento/installation-setup/configure-integration.html) to install and setup new Alokai project for Magento2

### Local dev setup
```bash
# install dependencies
$ yarn install

# serve with hot reload at localhost:3000
$ yarn dev
```

### Multistore local dev setup
1. Install [docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/) on your local machine.

2. Add your hosts to the `/etc/hosts` file:
    ```
    127.0.0.1       myshop1.local myshop2.local
    ```

3. Set `API_BASE_URL=/api/` env variable in the `.env` file.

4. If you're using Linux: uncomment lines 10 and 11 in the `docker-compose.yml` file.

5. Add your hosts to the `server_name` option inside the `docker/nginx/nginx.conf` file:
    ```
    server_name localhost myshop1.local myshop2.local;
    ```

6. Because this is a local dev setup and nginx is configured to use an unsecured HTTP connection, the `middleware.config.js` file needs to be updated to disable the secure cookie option. To achieve this, you can modify the `cookiesDefaultOpts` object in the `magento` integration section of the `middleware.config.js` file as follows:
    ```js
    module.exports = {
      integrations: {
        magento: {
          configuration: {
            cookiesDefaultOpts: {
              secure: process.env.VSF_COOKIE_SECURE || false,
            }
          }
        }
      }
    };
    ```

7. Start docker-compose daemon:
    ```bash
    $ docker-compose up -d
    ```

8. Start storefront dev server:
    ```bash
    $ yarn dev
    ```

## Resources

- [Alokai Documentation](https://docs.vuestorefront.io/v2/)
- [Alokai Enterprise Documentation](https://docs.vuestorefront.io/v2/general/enterprise.html)
- [Magento2 Integration Documentation](https://docs.vuestorefront.io/magento/)
- [API References](https://docs.vuestorefront.io/magento/api-reference/)
- [Community Chat](http://discord.vuestorefront.io)

## Support

If you have any questions about this integration we will be happy to answer them on  `Magento2` channel on [our Discord](http://discord.vuestorefront.io).
# Alokai / Vue Storefront 2 Magento Enhancements

Repository is a customized Alokai / Vue Storefront 2 application integrated with Magento 2.

This project focuses on improving the frontend user experience of an existing headless e-commerce storefront. Magento 2 is used as the backend and data source, while Vue Storefront 2 is used as the frontend layer.

The goal of this project was not to change Magento 2 backend business logic, but to improve the storefront user interface, theme structure, category navigation, homepage catalogue view, filters, search and loading states.

## Implemented changes

- Created a reusable SCSS/CSS variable based design layer
- Added centralized theme tokens for colors, backgrounds, text, borders, cards, forms, filters, sidebar and layout elements
- Added multiple configurable visual themes
- Added `default`, `fire` and `ice` theme support
- Added a `ThemeToggle` component for switching between available themes
- Stored the selected theme in `localStorage`
- Added environment variables for controlling available themes, default theme and theme switcher visibility
- Simplified the header layout
- Removed unnecessary demo/top-bar content from the header
- Added a new category navigation component
- Reworked the homepage into a catalogue-focused view
- Added category tree display on the homepage
- Added general filters for the homepage catalogue view
- Kept category-based filters for category pages
- Added grid/list view switching for product listing
- Added sorting and pagination support in the catalogue view
- Added current category path feedback
- Improved product card spacing and list view layout
- Improved the search empty state
- Improved the search suggestion card by showing more relevant product information
- Adjusted loading and skeleton states for custom themes

Magento 2 backend business logic and data structure were not modified.

## Theme layer

The theme layer is located in:

assets/styles/theme/

_tokens.scss
_fire.scss
_ice.scss
_base.scss
_layout.scss
_header.scss
_navigation.scss
_buttons.scss
_forms.scss
_product-card.scss
_product-page.scss
_search.scss
_filters.scss
_modal.scss
_sidebar.scss
_cart.scss
_home.scss
index.scss




The frontend must be connected to a running Magento 2 instance.
Vue Storefront 2 store, locale and currency values must match Magento store view configuration.

Example used during development:

```txt
Magento store code: et
Locale: et
Currency: EUR




Tested areas:
- Magento GraphQL connection
- Product and category rendering in the storefront
- Frontend build with `yarn build`, to make sure project compiles
- Fire and Ice theme switching
- Theme persistence after page reload
- Header and store switcher behavior
- Category navigation
- Categorie filters and general filters
- Search suggestion card
- Loading and skeleton states in dark theme