import BaseResourceCollection from './BaseResourceCollection';
import { combineUrls } from '../../utils/url';

export default class OrgResourceCollection extends BaseResourceCollection {
    protected getBaseUrl() {
        return combineUrls(this.serviceResolver.getOrgBaseUrl());
    }

    positions(projectId: string) {
        return combineUrls(this.getBaseUrl(), 'projects', projectId, 'positions');
    }
}