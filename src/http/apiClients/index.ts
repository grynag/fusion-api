import DataProxyClient from './DataProxyClient';
import FusionClient from './FusionClient';
import ContextClient from './ContextClient';
import TasksClient from './TasksClient';
import ResourceCollections from '../resourceCollections';
import { IHttpClient } from '../HttpClient';
import PeopleClient from './PeopleClient';
import OrgClient from './OrgClient';
import ReportClient from './ReportClient';
import PowerBIClient from './PowerBIClient';
import ServiceResolver from '../resourceCollections/ServiceResolver';

export { FusionApiHttpErrorResponse } from './models/common/FusionApiHttpErrorResponse';

type ApiClients = {
    dataProxy: DataProxyClient;
    fusion: FusionClient;
    context: ContextClient;
    tasks: TasksClient;
    people: PeopleClient;
    org: OrgClient;
    report: ReportClient;
    powerBI: PowerBIClient;
};

export const createApiClients = (
    httpClient: IHttpClient,
    resources: ResourceCollections,
    serviceResolver: ServiceResolver
): ApiClients => ({
    dataProxy: new DataProxyClient(httpClient, resources, serviceResolver),
    fusion: new FusionClient(httpClient, resources, serviceResolver),
    context: new ContextClient(httpClient, resources, serviceResolver),
    tasks: new TasksClient(httpClient, resources, serviceResolver),
    people: new PeopleClient(httpClient, resources, serviceResolver),
    org: new OrgClient(httpClient, resources, serviceResolver),
    report: new ReportClient(httpClient, resources, serviceResolver),
    powerBI: new PowerBIClient(httpClient, resources, serviceResolver),
});

export default ApiClients;
