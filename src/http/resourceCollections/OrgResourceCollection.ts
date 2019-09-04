import BaseResourceCollection from './BaseResourceCollection';
import { combineUrls } from '../../utils/url';

export default class OrgResourceCollection extends BaseResourceCollection {
    protected getBaseUrl() {
        return combineUrls(this.serviceResolver.getOrgBaseUrl());
    }

    positions(projectId: string) {
        return combineUrls(this.getBaseUrl(), 'projects', projectId, 'positions');
    }

    position(projectId: string, positionId: string, expand: boolean = true) {
        const url = combineUrls(this.positions(projectId), positionId);

        if (!expand) {
            return url;
        }

        const query = `?$expand=taskOwners.instances, reportsTo.instances, parentPosition, project, contract`;
        return `${url}${query}`;
    }

    jobDescription(projectId: string, positionId: string) {
        return combineUrls(this.position(projectId, positionId, false), 'jobDescription/content');
    }

    reportsTo(projectId: string, positionId: string) {
        return combineUrls(this.position(projectId, positionId, false), 'reportsTo');
    }
}
