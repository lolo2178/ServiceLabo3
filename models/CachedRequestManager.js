import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";

let CachedRequestExpirationTime = serverVariables.get("main.request.CacheExpirationTime");

// request file data models cache
global.requestCaches = [];
global.cachedrequestsCleanerStarted = false;

export default class CachedRequestsManager
{
    static startCachedRequestsCleaner() {
        // periodic cleaning of expired cached request data
        setInterval(CachedRequestsManager.flushExpired, CachedRequestExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic requests data caches cleaning process started...]");

    }

    static add(url, content, ETag ="") {
        if (!cachedrequestsCleanerStarted) {
            cachedrequestsCleanerStarted = true;
            CachedRequestsManager.startCachedRequestsCleaner();
        }
        if (url != "") {
            CachedRequestsManager.clear(model);
            requestCaches.push({
                url,
                content,
                ETag,
                Expire_Time: utilities.nowInSeconds() + CachedRequestExpirationTime
            });
            console.log(BgWhite + FgBlue, `[Data of ${url} has been cached]`);
        }
    }

    static find(url) {
        try {
            if (url != "") {
                for (let cache of requestCaches) {
                    if (cache.url == url) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + CachedRequestExpirationTime;
                        console.log(BgWhite + FgBlue, `[${cache.url} data retrieved from request cache]`);
                        return cache;
                    }
                }
            }
        } catch (error) {
            console.log(BgWhite + FgRed, "[request cache error!]", error);
        }
        return null;
    }

    static exists(url) {
        try {
            if (url != "") {
                for (let cache of requestCaches) {
                    if (cache.url == url) {
                        return true;
                    }
                }
            }
        } catch (error) {
            console.log(BgWhite + FgRed, "[request cache error!]", error);
        }
        return false;
    }
    static clear(url) {
        if (url != "") {
            let indexToDelete = [];
            let index = 0;
            for (let cache of requestCaches) {
                if (cache.url == url) indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(requestCaches, indexToDelete);
        }
    }

    static flushExpired() {
        let now = utilities.nowInSeconds();
        for (let cache of requestCaches) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgBlue, "Cached file data of " + cache.url + ".json expired");
            }
        }
        requestCaches = requestCaches.filter( cache => cache.Expire_Time > now);
    }

    static get(HttpContext) {
        if (HttpContext.isCachable)
        {
            console.log(BgWhite + FgBlue, HttpContext.req.url);
            if (HttpContext.req.url != null)
            {
                if (CachedRequestsManager.exists(HttpContext.req.url))
                {
                    let urlCache = CachedRequestsManager.find(HttpContext.req.url);
                    HttpContext.response.JSON(urlCache.content, urlCache.ETag, true);
                    return true;
                }
                
            }
        }
        return false;
        
    }
}