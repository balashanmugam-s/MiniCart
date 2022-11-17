import 'foundation-sites/js/foundation/foundation';
import 'foundation-sites/js/foundation/foundation.dropdown';
import utils from '@bigcommerce/stencil-utils';
import { normalizeFormData } from '../common/utils/api';

const CartPreviewEvents = {
    close: 'closed.fndtn.dropdown',
    open: 'opened.fndtn.dropdown',
};

const cartPreview = (secureBaseUrl, cartId) => {
    const loadingClass = 'is-loading';
    const $cart = $('[data-cart-preview]');
    const $cartDropdown = $('#cart-preview-dropdown');
    const $cartLoading = $('<div class="loadingOverlay"></div>');

    const $body = $('body');

    if (window.ApplePaySession) {
        $cartDropdown.addClass('apple-pay-supported');
    }

    $body.on('cart-quantity-update', (event, quantity) => {
        $cart.attr('aria-label', (_, prevValue) => prevValue.replace(/\d+/, quantity));

        if (!quantity) {
            $cart.addClass('navUser-item--cart__hidden-s');
        } else {
            $cart.removeClass('navUser-item--cart__hidden-s');
        }

        $('.cart-quantity')
            .text(quantity)
            .toggleClass('countPill--positive', quantity > 0);
        if (utils.tools.storage.localStorageAvailable()) {
            localStorage.setItem('cart-quantity', quantity);
        }
    });

    $cart.on('click', event => {
        const options = {
            template: 'common/cart-preview',
        };

        // Redirect to full cart page
        //
        // https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent
        // In summary, we recommend looking for the string 'Mobi' anywhere in the User Agent to detect a mobile device.
        if (/Mobi/i.test(navigator.userAgent)) {
            return event.stopPropagation();
        }

        event.preventDefault();

        $cartDropdown
            .addClass(loadingClass)
            .html($cartLoading);
        $cartLoading
            .show();

        utils.api.cart.getContent(options, (err, response) => {
            $cartDropdown
                .removeClass(loadingClass)
                .html(response);
            $cartLoading
                .hide();
        });
    });

    let quantity = 0;

    if (cartId) {
        // Get existing quantity from localStorage if found
        if (utils.tools.storage.localStorageAvailable()) {
            if (localStorage.getItem('cart-quantity')) {
                quantity = Number(localStorage.getItem('cart-quantity'));
                $body.trigger('cart-quantity-update', quantity);
            }
        }

        // Get updated cart quantity from the Cart API
        const cartQtyPromise = new Promise((resolve, reject) => {
            utils.api.cart.getCartQuantity({ baseUrl: secureBaseUrl, cartId }, (err, qty) => {
                if (err) {
                    // If this appears to be a 404 for the cart ID, set cart quantity to 0
                    if (err === 'Not Found') {
                        resolve(0);
                    } else {
                        reject(err);
                    }
                }
                resolve(qty);
            });
        });

        // If the Cart API gives us a different quantity number, update it
        cartQtyPromise.then(qty => {
            quantity = qty;
            $body.trigger('cart-quantity-update', quantity);
        });
    } else {
        $body.trigger('cart-quantity-update', quantity);
    }
}

class slideCart{
    constructor(){
        console.log("Slide Cart");
        this.cartClass = "#cart-preview-dropdown .previewCartWrapper";
        this.qtyInputChange = ".previewCartItem .form-increment .cart-item-qty-input";
        this.qtyChange = ".previewCartItem .form-increment .button--icon";
        
        this.$overlay = $('[data-cart] .loadingOverlay');
        this.$cartDropdown = $('#cart-preview-dropdown');
        this.$cartLoading = $('<div class="loadingOverlay"></div>');
        this.loadingClass = 'is-loading';
        this.$body = $('body');
        this.$cart = $('[data-cart-preview]');
        this.bodyOverlay = ".previewCartOverlay";
        this.$PLPAddCart = $("[data-button-type='add-cart']");
        const this_ = this;

        $(document).on('click','[data-cart-preview]',function(e){
            e.preventDefault();
            console.log("Data Cart Preview");
            this_.open();
        });
        $("body").click(function(e) {
            if (e.target.id != "cart-preview-dropdown" && $(e.target).parents("#cart-preview-dropdown").length == 0) {
                this_.close();
            }
        });

        if(this.$PLPAddCart.length > 0){
            $(document).on('click',"[data-button-type='add-cart']",function(e){
                e.preventDefault();
                var productId = parseInt($(this).attr("data-product-id"));
                console.log("Data Cart Preview");
                this_.addCart(productId,'',1);
            });
        }
    }

    bindEvents(){
        const this_ = this;
        // $(document).on('click',this.cartClass,function(){
        //     return false;
        // });
        // Quantity Change // 
        $(document).on('click',this.qtyChange,function(){
            var qty=0;
            var itemId = $(this).attr("data-cart-itemid");
            if($(this).attr("data-action") == "dec"){
                qty = parseInt($(this).next(".cart-item-qty-input").val());
                qty = qty - 1;
                if(qty>0){
                    $(this).next(".cart-item-qty-input").val(qty);
                }
            }
            if($(this).attr("data-action") == "inc"){
                qty = parseInt($(this).prev(".cart-item-qty-input").val());
                qty = qty + 1;
                if(qty>0){
                    $(this).prev(".cart-item-qty-input").val(qty);
                }
            }
            if(qty>0){
                this_.qtyUpdate(itemId,qty);
            }

        });
        $(document).on('change',this.qtyInputChange,function(){
            var itemId = $(this).attr("data-cart-itemid");
            var qty = parseInt($(this).val());
            if(qty>0){
                this_.qtyUpdate(itemId,qty);
            }
        });
        // Quantity Change //
    }
    open(){
        this.showBodyOverlay();
        this.showOverlay();
        this.refreshContent();
        this.bindEvents();
        this.$cartDropdown.addClass('is-open');
    }
    close(){
        this.$cartDropdown.removeClass('is-open');
        this.closeOverlay();
        this.closeBodyOverlay();
    }
    showBodyOverlay(){
        this.$body.addClass("cart-open");
        $(this.bodyOverlay).fadeIn(300);
    }
    closeBodyOverlay(){
        this.$body.removeClass("cart-open");
        $(this.bodyOverlay).fadeOut(300);
    }
    showOverlay(){
        this.showBodyOverlay();
        this.$cartDropdown
            .addClass(this.loadingClass)
            .html(this.$cartLoading);
        this.$cartLoading
            .show();
        this.$cartDropdown.addClass('is-open');
    }
    closeOverlay(){
        // $(this.bodyOverlay).fadeOut(300);
        this.$cartDropdown
        .removeClass(this.loadingClass);
        this.$cartLoading.hide();
    }
    qtyUpdate(itemId, newQty){
        // Update should be done using utils call.        
        // Inside Minicart quantity change occurs here.
        this.showOverlay();
        utils.api.cart.itemUpdate(itemId, newQty, (err, response) => {
            this.refreshContent();
        });
    }
    addCart(productId,qty) {
        // Add products to cart(Added from PLP card and Related Products Card)
        const this_ = this;
        var formData = new FormData();
        formData.append("action", "add");
        formData.append("product_id", productId);
        formData.append("qty[]", qty);
        utils.api.cart.itemAdd(normalizeFormData(formData), (err, response) => {
            this_.open();
        });
    };
    refreshContent() {
        const options = {
            template: 'common/cart-preview'
        };

        utils.api.cart.getContent(options, (err, response) => {
            this.closeOverlay();
            this.$cartDropdown
            .removeClass(this.loadingClass)
            .html(response);
        });
    }

}

export {cartPreview, CartPreviewEvents, slideCart};