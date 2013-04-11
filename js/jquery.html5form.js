/*
 * @package HTML5 Form Shim
 * @author sheiko
 * @license MIT
 * @copyright (c) Dmitry Sheiko http://www.dsheiko.com
 * @jscs standard:Jquery
 * Code style: http://docs.jquery.com/JQuery_Core_Style_Guidelines
 */

/*global define:false, exports:true, require: false, window:true */
/** @constructor */
var htmlFiveFormShim = (function( global, factory ) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // Rhino, and plain browser loading.
    if ( typeof define === 'function' && define.amd ) {
        define(function( require, exports, module ) {
            return factory( exports );
        });
    } else if ( typeof exports !== 'undefined' ) {
        return factory( exports );
    } else {
        return factory({});
    }
}( this, function( exports ) {
    'use strict';
     exports.version = '2.0.2-dev';

     // Additional lambda-function to get original undefined
     return (function( global, undefined ) {
                /**
         * Get reference to jQuery
         * @type {object}
         **/
        var $ = (function( global ) {
                if ( global.jQuery === undefined ) {
                    throw new ReferenceError("jQuery is required");
                }
                return global.jQuery;
            }( global )),
            /** @type {object} */
            document = global.document,
            /**
             *  How long on-input event handler waits before catching the input
             *  @constant
             *  @default
             */
            ONINPUT_DELAY = 500,
            /** @namespace */
            util = {

               /**
                * Object.create replica for pseudo-classes of module design
                * createInstance implements C-like inheritance
                * in JavaScript. When a pseudo-class is intended to extend
                * other one, it's enough just put base class object in __extends__
                * properry.
                * Module-like object context isn't available within constructor
                * function scope (being created only on its return). createInstance
                * calls automaticale __constructor__ method, if one provided,
                * right after instance creation. So it can be used as constructor
                * for modules
                * @see http://dsheiko.com/weblog/prototypal-inheritance-in-javascript-for-modules/
                * @memberof util
                * @param {function} module - object constructor
                * @param {array} args - array of arguments
                * @return {object}
                */
               createInstance: function( module, args ) {
                   var key,
                        instance,
                        members = module.apply( module.prototype, args || [] ) || {},
                        Fn = function () {};

                    if ( members.hasOwnProperty( "__extends__" ) &&
                        members[ "__extends__" ] ) {
                        module.prototype =
                            util.createInstance( members[ "__extends__" ], args );
                    }
                    Fn.prototype = module.prototype; // Link to the supertype
                    for ( key in members ) { // Mix in members
                        if ( members.hasOwnProperty( key ) ) {
                            Fn.prototype[ key ] = members[ key ];
                        }
                    }
                    instance = new Fn();
                    members.hasOwnProperty("__constructor__") &&
                        members[ "__constructor__" ].apply(instance, args || [] );
                    return instance;
               },
               /**
                * Wrapper for DOMContentLoaded event listener to support AMD
                * @memberof util
                * @param {function} fn
                */
                onDomReady: function( fn ) {
                    if ( typeof define === 'function' && define.amd ) {
                        require( [ 'domReady' ], function ( domReady ) {
                            domReady( fn );
                        });
                    } else {
                        $( document ).ready( fn );
                    }
                },
                /**
                 * PHP replica of is_string
                 * @memberof util
                 * @param {*} value
                 * @return {boolean}
                 */
                isString :  function( value ) {
                    return typeof( value ) === 'string' && isNaN( value );
                },
                /**
                 * PHP replica of is_numeric
                 * @memberof util
                 * @param {*} value
                 * @return {boolean}
                 */
                isNumber :  function( value ) {
                    return !isNaN( parseFloat( value ) ) && isFinite( value );
                },
                /**
                 * Make a string's first character uppercase, others lowercase
                 * @memberof util
                 * @param {string} str
                 * @return {string}
                 */
                 ucfirst: function( str ) {
                      str += '';
                      return str.charAt( 0 ).toUpperCase() + ( str.substr( 1 ).toLowerCase() );
                 }
           },
           /**
            * @namespace
            * @property {object} supportedInputTypes - List of supported types of input element
            * @property {object} supportedInputProps - List of supported properties of input element
            */
           modernizr = {
                /**
                 *  List of supported types of input element
                 *  Run through HTML5's new input types to see if the UA understands any.
                 *  Implementation adopted from http://www.modernizr.com
                 *  @memberof modernizr
                 *  @type {Array)
                 */
                supportedInputTypes: (function() {
                    var inputElem = document.createElement('input'),
                    types = (function(props) {
                    for ( var i = 0, types = [], len = props.length; i < len; i++ ) {
                        inputElem.setAttribute( 'type', props[i] );
                        types[ props[ i ] ] = !!( inputElem.type !== 'text' );
                    }
                    return types;
                    })( 'search tel url email datetime date month week time datetime-local number range color' . split(' ') );
                  return types;
                }()),
                /*
                 * List of supported properties of input element
                 * Run through HTML5's new input attributes to see if the UA understands any.
                 * Implementation adopted from http://www.modernizr.com
                 *  spec: http://www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary
                 * @memberof modernizr
                 * @type {array}
                 */
                supportedInputProps: (function() {
                    var inputElem = document.createElement('input'),
                        attrs = (function( props ) {
                            for ( var i = 0, attrs = [], len = props.length; i < len; i++ ) {
                                attrs[ props[i] ] = !!(props[i] in inputElem);
                            }
                            return attrs;
                        })('autocomplete autofocus list placeholder max min multiple pattern required step'
                            .split(' '));
                    return attrs;
                }())
            },
           /**
            * @class
            */
           Page = function() {
               var forms = [];
               return {
                   /**
                    * @name __constructor__
                    * @memberof Page
                    */
                   "__constructor__": function() {
                       $("form").each(function(){
                           forms.push( util.createInstance( Form, [ $( this ) ] ) );
                       });
                   }
               };
           },
           /**
            * @class
            */
           Form = function( ) {
               var increment = 0;
               return {
                   /**
                    * Reference to the form element
                    * @memberof Form
                    * @type {object}
                    */
                   boundingBox: null,
                   /**
                    * List of monitored child inputs
                    * @memberof Form
                    * @type {array}
                    */
                   inputs: {},
                   /**
                    * @name __constructor__
                    * @memberof Form
                    */
                   "__constructor__" : function( boundingBox ) {
                       var that = this;
                       this.boundingBox = boundingBox;
                       // Untie object reference
                       this.inputs = [];
                       if (this.isCustomValidation()) {
                           this.boundingBox.attr( "novalidate", "novalidate" );
                       }
                       this.shimFormAttrMutators();
                       this.initInputs();
                       this.boundingBox.on( 'submit', function( e ){
                           that.handleOnSubmit( e );
                       });
                   },
                   /**
                    * Obtain input local id (in-form unique hash)
                    * If it is not defined, the function generates a new id and
                    * bind it to the input
                    * @memberof Form
                    * @return (number)
                    */
                   getLocalId: function( $node ) {
                        var localId = $node.data("local-id") || increment++;
                        $node.data("local-id", localId );
                        return localId;
                   },
                   /**
                    * Get AbstractInput by node
                    * @memberof Form
                    * @return (object) AbstractInput
                    */
                   getInput: function( node ) {
                       // HTMLElement given
                       var $node = $( node ),
                           localId = this.getLocalId( $node );
                        return this.inputs[ localId ];
                   },
                   /**
                    * Collect child inputs to monitor
                    * @private
                    * @memberof Form
                    */
                   initInputs: function() {
                       var that = this;
                       this.boundingBox.find("input, textarea").each(function(){
                            var $node = $( this ),
                                localId = that.getLocalId( $node ),
                                instance = that.inputFactory( $node );

                            if ( instance !== false ) {
                                that.inputs[ localId ] = instance;
                            }
                        });
                   },
                   /**
                    * Shim formaction, formenctype, formmethod, and formtarget
                    * @private
                    * @memberof Form
                    */
                   shimFormAttrMutators: function() {
                       var that = this;
                       this.boundingBox.find("input, button").each(function(){
                            $( this ).attr('formaction')  &&
                                $( this ).on( "click", function() {
                                    that.boundingBox.attr( 'action',
                                        $( this ).attr('formaction') );
                                });
                            $( this ).attr('formenctype') &&
                                $( this ).on( "click", function() {
                                    that.boundingBox.attr( 'enctype',
                                        $( this ).attr('formenctype') );
                                });
                            $( this ).attr('formmethod') &&
                                $( this ).on( "click", function() {
                                    that.boundingBox.attr( 'method',
                                        $( this ).attr('formmethod') );
                                });
                            $( this ).attr('formtarget') &&
                                $( this ).on( "click", function() {
                                    that.boundingBox.attr( 'target',
                                        $( this ).attr('formtarget') );
                                });
                        });
                   },
                   /**
                    * Is data-custom-validation attribute set?
                    * @public
                    * @memberof Form
                    */
                   isCustomValidation: function() {
                       return ( this.boundingBox.data('custom-validation') !== undefined );
                   },
                   /**
                    * Is novalidate attribute set?
                    * @public
                    * @memberof Form
                    */
                   isNoValidate: function() {
                       return ( this.boundingBox.attr('novalidate') !== undefined );
                   },
                   /**
                    * Set form to valid state
                    * @public
                    * @memberof Form
                    */
                   setValid: function() {
                       this.boundingBox.addClass('valid').removeClass('invalid');
                   },
                   /**
                    * Set form to invalid state
                    * @public
                    * @memberof Form
                    */
                   setInvalid: function() {
                       this.boundingBox.addClass('invalid').removeClass('valid');
                   },
                   /**
                    * Make an instance of custom validator for a given input type
                    * @public
                    * @constructs AbstractInput instances
                    * @memberof Form
                    */
                   inputFactory : function( element ) {
                       var type = util.ucfirst( element.attr('type') );
                       return util.createInstance(
                        Input[ type ] || Input.Text, [ element, this.isCustomValidation() ] );
                   },
                   /**
                    * Handle on-submit event
                    * @param (Event) e
                    * @private
                    * @memberof Form
                    */
                   handleOnSubmit : function( e ) {
                       var isValid = true;
                       if ( !this.inputs ) {
                           return;
                       }
                       for( var i in this.inputs ) {
                           if ( this.inputs.hasOwnProperty( i ) ) {
                                var input = this.inputs[ i ];
                                if ( input.isShimRequired() ) {
                                     // Here check for required
                                     input.validateRequired();
                                     input.updateState();
                                     // Here check for validity
                                     if ( !input.isValid() ) {
                                         if ( input.validationMessageNode ) {
                                             input.showValidationMessage();
                                         } else {
                                             // Show tooltip and stop propagation
                                             isValid && input.showTooltip();
                                         }
                                         isValid = false;
                                     }
                                }
                           }
                       }
                       if ( isValid ) {
                           this.setValid();
                       } else {
                           this.setInvalid();
                           e.preventDefault();
                       }
                   }
               };
           },
           /**
            * Handle validation messages per input
            * @class
            */
           ValidationLogger = function() {
               var messages = [],
                   // { message code : default message }
                   codeXmsgMap = {
                       valueMissing : "Please fill out this field",
                       typeMismatch : null,
                       patternMismatch : "The pattern is mismatched",
                       rangeUnderflow: "The value is too low",
                       rangeOverflow: "The value is too high",
                       tooLong: "The value is too long",
                       stepMismatch: "Invalid step for the range",
                       badInput: "The user agent is unable to convert to a value",
                       customError: null
                   };
               return {
                   /**
                    * Reset logger state
                    * @public
                    * @memberof ValidationLogger
                    */
                   reset: function() {
                       messages = [];
                   },
                   /**
                    * Set message by code and msg for writtable properties
                    * ( typeMismatch, customError )
                    * Set message by only code for others
                    *
                    * @public
                    * @param {string} code
                    * @param {string} msg OPTIONAL
                    * @memberof ValidationLogger
                    */
                   setMessage: function( code, msg ) {
                       if ( codeXmsgMap[ code ] === undefined ) {
                           throw new SyntaxError(
                           "Invalid validation message code '" +
                           code + "'" );
                       }
                       messages.push({
                           code: code,
                           message: msg || codeXmsgMap[ code ]
                        });
                   },
                   /**
                    * Take the first validation message text from the stack
                    *
                    * @public
                    * @return {string}
                    * @memberof ValidationLogger
                    */
                   getMessage: function() {
                       return this.isEmpty() ? null : messages[ 0 ].message;
                   },
                   /**
                    * Take the first validation message code from the stack
                    *
                    * @public
                    * @return {string}
                    * @memberof ValidationLogger
                    */
                   getCode: function() {
                       return this.isEmpty() ? null : messages[ 0 ].code;
                   },
                   /**
                    * Expose all messages for API response emulation
                    *
                    * @public
                    * @return {array}
                    * @memberof ValidationLogger
                    */
                   getMessages: function() {
                       return messages;
                   },
                   /**
                    * Check if the object represent an empty array
                    *
                    * @return {boolean}
                    * @memberof ValidationLogger
                    */
                   isEmpty: function() {
                       return !messages.length;
                   }
               };
           },
           /**
            * Abstract input (input of a given type or textarea)
            * @class
            */
           AbstractInput = function() {
               return {
                   /**
                    * Reference to the input element
                    * @memberof AbstractInput
                    * @type {object}
                    */
                   boundingBox: null,
                   /**
                    * Instance of ValidationLogger
                    * @memberof AbstractInput
                    * @type {object}
                    */
                   logger: null,
                   /**
                    * reference to the bound validation message container
                    * @memberof AbstractInput
                    * @type {object}
                    */
                   validationMessageNode: null,
                   /**
                    * Timeout id
                    * @memberof AbstractInput
                    * @type {number}
                    */
                   deferredRequest: null,
                   /**
                    * @memberof AbstractInput
                    * @type {boolean}
                    */
                   forceShim: false,
                   /**
                    * Input constructor
                    * @name __constructor__
                    * @memberof AbstractInput
                    * @param {object} boundingBox
                    * @param {boolean} forceShim
                    */
                   "__constructor__": function( boundingBox, forceShim ) {
                       var that = this;
                       this.logger = new ValidationLogger();
                       this.boundingBox = boundingBox;
                       this.forceShim = !!forceShim;
                       this.boundingBox.removeClass('valid invalid');

                       // Support checkValidity element method
                       this.boundingBox.checkValidity = function() {
                           return that.checkValidity();
                       };
                       // Support setCustomValidity element method
                       this.boundingBox.get( 0 ).setCustomValidity =
                           $.fn.setCustomValidity;

                       this.lookForValidationMessageNode();

                       if ( this.forceShim ||
                           !modernizr.supportedInputProps.placeholder) {
                           this.shimPlaceholder();
                       }
                       // If required attr. is not supported,
                       // mark the field with "required" class
                       if ( this.forceShim ||
                           !modernizr.supportedInputProps.required) {
                           this.shimRequired();
                       }
                       if ( this.forceShim ||
                           !modernizr.supportedInputProps.autofocus) {
                           this.shimAutofocus();
                       }
                       // If custom-validation attr declared,
                       // it disables default H5 form handler
                       if (this.boundingBox.data('custom-validation')) {
                           this.boundingBox.attr( 'novalidate', 'novalidate' );
                       }
                       if ( this.isShimRequired() ) {
                           this.shimOnInput();
                       }
                   },
                   /**
                    * alias for jQuery().val()
                    * @public
                    * @return (String)
                    * @memberof AbstractInput
                    */
                   val : function( val ) {
                       return val !== undefined ? ( this.boundingBox = val ) :
                           this.boundingBox;
                   },
                   /**
                    * Set attribute text to avoid collisions with browser
                    * embedded input handlers
                    * @public
                    * @memberof AbstractInput
                    */
                   degrade : function() {
                       this.boundingBox.get( 0 ).type = "text";
                       return this;
                   },
                   /**
                    * Shim is required when the input type isn't supported
                    * or custom validation requsted
                    * @public
                    * @return (Boolean)
                    * @memberof AbstractInput
                    */
                   isShimRequired : function() {
                        return this.forceShim ||
                           !modernizr.supportedInputTypes[ this.boundingBox.attr('type') ] ||
                           this.boundingBox.data('custom-validation');
                   },
                   /**
                    * Emulate API (http://www.w3.org/html/wg/drafts/html/master/forms.html#the-constraint-validation-api)
                    * response
                    * @protected
                    * @memberof AbstractInput
                    */
                   shimApi: function() {
                       var $node = this.boundingBox;

                       $node.validity = $node.validity || {};
                       $.each( this.logger.getMessages(), function( inx, msg ){
                           // element.validity object properties are read-only
                           // so no way to overrride them
                           $node.validity[ msg.code ] = true;
                       });
                       $node.validationMessage = this.logger.getMessage();
                       $node.validity.valid = this.isValid();

                   },
                   /**
                    * Emulate API method checkValidity
                    * @public
                    * @memberof AbstractInput
                    */
                   checkValidity: function() {
                        this.validateRequired();
                        this.validateValue && this.validateValue();
                        this.validateByPattern();
                        return this.isValid();
                   },
                   /**
                    * If validation message node assigned for this input found
                    * It will be used instead of tooltip
                    * @memberof AbstractInput
                    */
                   lookForValidationMessageNode: function() {
                       var id, $hint;
                       if ((id = this.boundingBox.attr("id"))) {
                           $hint = $( "form *[data-validation-message-for=" + id + "]" );
                           this.validationMessageNode = $hint.length ? $hint : null;
                       }
                   },
                   /**
                    * Show message in validation message placeholder node
                    * @public
                    * @memberof AbstractInput
                    */
                   showValidationMessage: function() {
                       var msg = this.boundingBox.validationMessage;
                       this.validationMessageNode.html( msg );
                       this.validationMessageNode[ msg ? "show" : "hide" ]();
                   },
                   /**
                    * Subscribe for oninput events
                    * @protected
                    * @memberof AbstractInput
                    */
                   shimOnInput: function() {
                       var that = this;
                       this.boundingBox
                        .on( 'change mouseup keydown', function() {
                            that.handleOnInput();
                        });
                       // @TODO: Context menu handling:
                       // this.boundingBox.get().oncontextmenu =  _private.handleOnInput;

                   },
                   /**
                    * Check if there is no validation exceptions so far
                    * @public
                    * @memberof AbstractInput
                    */
                   isValid : function() {
                       return this.logger.isEmpty() && this.checkCustomValidity();
                   },
                   /**
                    * Emulates oninput event
                    * @protecteds
                    * @memberof AbstractInput
                    */
                   handleOnInput: function() {
                       var that = this;
                       if ( null !== this.deferredRequest ) {
                           global.clearTimeout( this.deferredRequest );
                       }
                       this.deferredRequest = global.setTimeout( function(){
                           that.logger.reset();
                           that.shimApi();
                           that.deferredRequest = null;
                           that.invokeOnInputCallBack();
                           that.boundingBox.trigger( "oninput", that );
                           that.validateValue && that.validateValue();
                           that.validateByPattern();
                           that.updateState();
                           if ( that.validationMessageNode ) {
                                that.validationMessageNode.html( that.boundingBox.validationMessage );
                            }
                       }, ONINPUT_DELAY );
                   },
                   /**
                    * Calls a global handler specified in oninput attribute
                    * @protected
                    * @memberof AbstractInput
                    */
                   invokeOnInputCallBack: function() {
                       var callbackKey, pos;
                       if (this.boundingBox.attr("oninput") !== undefined) {
                           callbackKey = this.boundingBox.attr("oninput");
                           pos = callbackKey.indexOf("(");
                           callbackKey = pos ? callbackKey.substr( 0, pos ) : callbackKey;
                           if (typeof global[callbackKey]) {
                               global[callbackKey](this.boundingBox);
                           }
                       }
                   },
                   /**
                    * Remove placeholder on focus
                    * @protected
                    * @memberof AbstractInput
                    */
                   handleOnFocus : function() {
                       this.boundingBox.addClass('focus');
                       if (this.boundingBox.val() === this.boundingBox.attr('placeholder')) {
                           this.boundingBox.val('');
                           this.boundingBox.removeClass('placeholder');
                       }

                   },
                   /**
                    * Restore placeholder on blur
                    * @protected
                    * @memberof AbstractInput
                    */
                   handleOnBlur : function() {
                       this.boundingBox.removeClass('focus');
                       if (!this.boundingBox.val()) {
                           this.boundingBox.val( this.boundingBox.attr('placeholder') );
                           this.boundingBox.addClass('placeholder');
                       }
                   },
                    /**
                     * Is used on form submittion to check if
                     * data-customvalidity attr. was not changed externally (e.g. AJAX)
                     * @protected
                     * @memberof AbstractInput
                     */
                   checkCustomValidity: function() {
                       if ( this.boundingBox.data('customvalidity') ) {
                           this.boundingBox.validationMessage = this.boundingBox.data('customvalidity');
                           return false;
                       }
                       return true;
                   },
                   /**
                    * Add required class to element. That goes for
                    * CSS as well as for further checking
                    * @protected
                    * @memberof AbstractInput
                    */
                   shimRequired: function() {
                       this.boundingBox.attr('required') === undefined ||
                           this.boundingBox.addClass('required')
                               .data("custom-validation" , "true");
                   },
                   /**
                    * Force focus
                    * and remove placeholder
                    * @protected
                    * @memberof AbstractInput
                    */
                   shimAutofocus: function() {
                       if (this.boundingBox.attr('autofocus') !== undefined) {
                           this.boundingBox.focus();
                           this.handleOnFocus();
                       }
                   },
                   /**
                    * Fallback placeholder handler
                    * @protected
                    * @memberof AbstractInput
                    */
                   shimPlaceholder: function() {
                       var that = this;
                       if ( this.boundingBox.attr("placeholder") !== undefined ) {
                           this.boundingBox.attr( "autocomplete", "false" );
                           // Display placeholder
                           this.handleOnBlur();
                           // Sync UI
                           this.boundingBox.on( 'focusin', function() {
                               that.handleOnFocus();
                           }).on( 'focusout', function() {
                               that.handleOnBlur();
                           });
                       }
                   },
                   /**
                    * Is invoked after every validation
                    * @protected
                    * @memberof AbstractInput
                    */
                   throwValidationException: function( code, msg ) {
                       this.logger.setMessage( code, msg );
                       this.shimApi();
                   },
                   /**
                    * Fallback for pattern validator
                    * @public
                    * @memberof AbstractInput
                    * @return {object} ValidationLogger
                    */
                   validateByPattern: function() {
                       if (!this.boundingBox.attr('pattern')) {
                           return true;
                       }
                       var pattern = new RegExp( this.boundingBox.attr('pattern'), 'g' );
                       pattern.test( this.boundingBox.val() ) ||
                            this.throwValidationException( "patternMismatch",
                                this.boundingBox.attr('title') || null );
                       return this.logger;
                   },
                   /**
                    * Fallback for isRequired validator
                    * @public
                    * @memberof AbstractInput
                    * @return {object} ValidationLogger
                    */
                   validateRequired: function() {
                       if ( this.boundingBox.hasClass('required')  &&
                            ( this.boundingBox.val() === this.boundingBox.attr('placeholder') ||
                            !this.boundingBox.val())) {
                            this.throwValidationException("valueMissing");
                        }
                        return this.logger;
                   },
                   /**
                    * Update status of input
                    * @public
                    * @memberof AbstractInput
                    * @return (String) state
                    */
                   updateState: function() {
                       var state = this.isValid() ? 'valid' : 'invalid';
                       this.boundingBox
                        .removeClass('valid invalid')
                        .addClass( state );
                        return state;
                   },
                   /**
                    * Show tooltip with validation message on the input
                    * @public
                    * @memberof AbstractInput
                    */
                   showTooltip : function( msg ) {
                      $.setCustomValidityCallback.apply( this.boundingBox,
                            [ msg || this.boundingBox.validationMessage ]);
                   }
               };
           },
           /**
            * Input type custom validators
            * @namespace
            */
           Input = {
               /** @class */
               Text: function() {
                   return {
                       "__extends__" : AbstractInput
                   };
               },
               /** @class */
               Tel: function() {
                    return {
                        "__extends__" : AbstractInput,
                        /**
                         * @name __constructor__
                         * @memberof Input.Tel
                         */
                        "__constructor__": function() {
                           this.degrade();
                        },
                        /**
                         * Validate input value
                         *
                         * @public
                         * @memberof Input.Tel
                         * @return {object} ValidationLogger
                         */
                        validateValue: function() {
                            var pattern = /^\+(?:[0-9] ?){6,14}[0-9]$/;
                            pattern.test( this.boundingBox.val() ) ||
                                this.throwValidationException( "typeMismatch",
                                "Please enter a valid tel. number +1 11 11 11");
                            return this.logger;
                        }
                    };
                },
               /** @class */
               Email: function() {
                    return {
                        "__extends__" : AbstractInput,
                        /**
                         * @name __constructor__
                         * @memberof Input.Email
                         */
                        "__constructor__": function() {
                           this.degrade();
                        },
                        /**
                         * Validate input value
                         *
                         * @public
                         * @memberof Input.Email
                         * @return {object} ValidationLogger
                         */
                        validateValue: function() {
                            var pattern = /^[a-zA-Z0-9._\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,4}$/g;
                            pattern.test( this.boundingBox.val() ) ||
                                this.throwValidationException( "typeMismatch",
                                    "Please enter a valid email address");
                            return this.logger;
                        }
                    };
                },
               /** @class */
               Number: function() {
                    return {
                        "__extends__" : AbstractInput,
                        /**
                         * @name __constructor__
                         * @memberof Input.Number
                         */
                        "__constructor__": function() {
                           this.degrade();
                        },
                        /**
                         * Validate input value
                         *
                         * @public
                         * @memberof Input.Number
                         * @return {object} ValidationLogger
                         */
                        validateValue: function() {
                            util.isNumber( parseInt( this.boundingBox.val(), 10 ) ) ||
                                this.throwValidationException( "typeMismatch",
                                    "Please enter a valid number");
                            (this.boundingBox.attr('min') &&
                                parseInt(this.boundingBox.val(), 10) < parseInt(this.boundingBox.attr('min'), 10)) &&
                                this.throwValidationException("rangeUnderflow");

                            (this.boundingBox.attr('max') &&
                                parseInt(this.boundingBox.val(), 10) > parseInt(this.boundingBox.attr('max'), 10)) &&
                                this.throwValidationException("rangeOverflow");

                            return this.logger;
                        }
                    };
               },
               /** @class */
               Url: function() {
                   return {
                       "__extends__" : AbstractInput,
                        /**
                         * @name __constructor__
                         * @memberof Input.Url
                         */
                       "__constructor__": function() {
                           this.degrade();
                       },
                       /**
                         * Validate input value
                         *
                         * @public
                         * @memberof Input.Url
                         * @return {object} ValidationLogger
                         */
                       validateValue: function() {
                           // The pattern is taken from http://stackoverflow.com/questions/2838404/javascript-regex-url-matching
                           // pattern fragments: protocol, domain name OR ip (v4) address, port and path, query string, fragment locater
                           var pattern = /^(https?:\/\/)?((([a-z\d]([a-z\d\-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[\-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=\-]*)?(\#[\-a-z\d_]*)?$/i;
                            pattern.test( this.boundingBox.val() ) ||
                                this.throwValidationException( "typeMismatch",
                                    "Please enter a valid URL");
                            return this.logger;
                       }
                   };
               }
           };

     /**
      * Set custom validator
      *
      * @param {string} type e.g. Zip
      * @param {string} msg validation message
      * @param {function} fn( node: jQuery, logger: ValidationLogger ): boolean
      */
     $.setCustomInputTypeValidator = function( type, msg, validatorCb, initCb ) {
         /**
          * @class
          * @name Input.AbstractType
          */
         Input[ util.ucfirst( type ) ] = function() {
                return {
                    "__extends__" : AbstractInput,
                   /**
                    * @name __constructor__
                    * @memberof Input.AbstractType
                    */
                    "__constructor__": function() {
                        initCb && initCb.apply( this.boundingBox, [ this ] );
                    },
                   /**
                    * Validate input value
                    *
                    * @public
                    * @memberof Input.AbstractType
                    * @return {object} ValidationLogger
                    */
                    validateValue: function() {
                        validatorCb.apply( this.boundingBox, [ this ] ) ||
                            this.throwValidationException( "customError", msg );
                        return this.logger;
                    }
                };
            };
     };

    /**
     * Render tooltip when validation error happens on form submition
     * Can be overriden
     * @param (String) error
     */
     $.setCustomValidityCallback = function( error ) {
       var pos = this.position(),
            tooltip = $( '<div class="tooltip tooltip-e">' +
                '<div class="tooltip-arrow tooltip-arrow-e"></div>' +
                 '<div class="tooltip-inner">' + error + '</div>' +
            '</div>' ).appendTo( this.parent() );
            tooltip.css( 'top', pos.top - ( tooltip.height() / 2 ) + 20 );
            tooltip.css( 'left', pos.left - tooltip.width() - 12 );
            global.setTimeout( function(){
                 tooltip.remove();
            }, 2500 );
    };
    /**
     * Shim for setCustomValidity DOM element method
     * Sets a custom error, so that the element would fail to validate.
     * The given message is the message to be shown to the user when
     * reporting the problem to the user.
     * If the argument is the empty string, clears the custom error.
     * @see http://www.w3.org/html/wg/drafts/html/master/forms.html#the-constraint-validation-api
     * @param {string} message
     */
    $.fn.setCustomValidity = function( message ) {
        $( this ).each(function( inx, el ) {
            $( el ).data( 'customvalidity', message );
        });
    };


       util.onDomReady(function(){
           util.createInstance( Page );
       });

       return {
           /**
            * Repeat initialization on a given form or all the forms in DOM
            * if no argument given
            * @memberof htmlFiveFormShim
            * @static
            * @param {object} $form  OPTIONAL
            */
           init: function( $form ) {
               if ( $form && $form.length ) {
                   return util.createInstance( Form, [ $form ] );
               }
               $("form").each(function(){
                    util.createInstance( Form, [ $form ] );
                });
           },
           /**
            * Provide access to objects from unit-tests            *
            * @memberof htmlFiveFormShim
            * @static
            */
           getTestable: function() {
               return {
                   util: util,
                   ValidationLogger: ValidationLogger,
                   Input: Input
               };
           }
       };
    }( window ));
}));
