"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var client_1 = require("@apollo/client");
var DebounceLink = (function (_super) {
    __extends(DebounceLink, _super);
    function DebounceLink(defaultDelay) {
        var _this = _super.call(this) || this;
        _this.debounceInfo = {};
        _this.cleanup = function (debounceKey, groupId) {
            var dbi = _this.debounceInfo[debounceKey];
            if (!dbi) {
                return;
            }
            delete dbi.runningSubscriptions[groupId];
            if (groupId === dbi.currentGroupId) {
                clearTimeout(dbi.timeout);
            }
            var noRunningSubscriptions = Object.keys(dbi.runningSubscriptions).length === 0;
            var noQueuedObservers = dbi.queuedObservers.length === 0;
            if (noRunningSubscriptions && noQueuedObservers) {
                delete _this.debounceInfo[debounceKey];
            }
        };
        _this.unsubscribe = function (debounceKey, debounceGroupId, observer) {
            var isNotObserver = function (obs) { return obs !== observer; };
            var dbi = _this.debounceInfo[debounceKey];
            if (!dbi) {
                return;
            }
            if (debounceGroupId === dbi.currentGroupId) {
                dbi.queuedObservers = dbi.queuedObservers.filter(isNotObserver);
                if (dbi.queuedObservers.length === 0) {
                    _this.cleanup(debounceKey, debounceGroupId);
                }
                return;
            }
            var observerGroup = dbi.runningSubscriptions[debounceGroupId];
            if (observerGroup) {
                observerGroup.observers = observerGroup.observers.filter(isNotObserver);
                if (observerGroup.observers.length === 0) {
                    observerGroup.subscription.unsubscribe();
                    _this.cleanup(debounceKey, debounceGroupId);
                }
            }
        };
        _this.defaultDelay = defaultDelay;
        return _this;
    }
    DebounceLink.prototype.request = function (operation, forward) {
        var _this = this;
        var _a = operation.getContext(), debounceKey = _a.debounceKey, debounceTimeout = _a.debounceTimeout;
        if (!debounceKey) {
            return forward(operation);
        }
        return new client_1.Observable(function (observer) {
            var debounceGroupId = _this.enqueueRequest({ debounceKey: debounceKey, debounceTimeout: debounceTimeout }, { operation: operation, forward: forward, observer: observer });
            return function () {
                _this.unsubscribe(debounceKey, debounceGroupId, observer);
            };
        });
    };
    DebounceLink.prototype.setupDebounceInfo = function (debounceKey) {
        this.debounceInfo[debounceKey] = {
            runningSubscriptions: {},
            queuedObservers: [],
            currentGroupId: 0,
            timeout: undefined,
            lastRequest: undefined
        };
        return this.debounceInfo[debounceKey];
    };
    DebounceLink.prototype.enqueueRequest = function (_a, _b) {
        var _this = this;
        var debounceKey = _a.debounceKey, debounceTimeout = _a.debounceTimeout;
        var operation = _b.operation, forward = _b.forward, observer = _b.observer;
        var dbi = this.debounceInfo[debounceKey] || this.setupDebounceInfo(debounceKey);
        dbi.queuedObservers.push(observer);
        dbi.lastRequest = { operation: operation, forward: forward };
        if (dbi.timeout) {
            clearTimeout(dbi.timeout);
        }
        dbi.timeout = setTimeout(function () { return _this.flush(debounceKey); }, debounceTimeout || this.defaultDelay);
        return dbi.currentGroupId;
    };
    DebounceLink.prototype.flush = function (debounceKey) {
        var _this = this;
        var dbi = this.debounceInfo[debounceKey];
        if (dbi.queuedObservers.length === 0 || typeof dbi.lastRequest === 'undefined') {
            return;
        }
        var _a = dbi.lastRequest, operation = _a.operation, forward = _a.forward;
        var currentObservers = __spreadArrays(dbi.queuedObservers);
        var groupId = dbi.currentGroupId;
        var sub = forward(operation).subscribe({
            next: function (v) {
                currentObservers.forEach(function (observer) { return observer.next && observer.next(v); });
            },
            error: function (e) {
                currentObservers.forEach(function (observer) { return observer.error && observer.error(e); });
                _this.cleanup(debounceKey, groupId);
            },
            complete: function () {
                currentObservers.forEach(function (observer) { return observer.complete && observer.complete(); });
                _this.cleanup(debounceKey, groupId);
            }
        });
        dbi.runningSubscriptions[dbi.currentGroupId] = {
            subscription: sub,
            observers: currentObservers
        };
        dbi.queuedObservers = [];
        dbi.currentGroupId++;
    };
    return DebounceLink;
}(client_1.ApolloLink));
exports["default"] = DebounceLink;
//# sourceMappingURL=DebounceLink.js.map