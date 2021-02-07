/// <reference types="zen-observable" />
import { ApolloLink, FetchResult, Observable, Operation, NextLink } from '@apollo/client';
export default class DebounceLink extends ApolloLink {
    private debounceInfo;
    private defaultDelay;
    constructor(defaultDelay: number);
    request(operation: Operation, forward: NextLink): Observable<FetchResult<{
        [key: string]: any;
    }, Record<string, any>, Record<string, any>>>;
    private setupDebounceInfo;
    private enqueueRequest;
    private cleanup;
    private flush;
    private unsubscribe;
}
