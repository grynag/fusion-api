import React, { useState, useEffect, useCallback } from "react";
import { useFusionContext } from "../core/FusionContext";
import AppManifest from "./AppManifest";

type AppWrapperProps = {
    appKey: string;
};

const AppWrapper: React.FC<AppWrapperProps> = ({ appKey }: AppWrapperProps) => {
    const {
        app: { container: appContainer },
        http: { apiClients },
    } = useFusionContext();
    const [isFetching, setIsFetching] = useState(false);

    const [, forceUpdate] = useState();
    useEffect(() => {
        return appContainer.on("update", app => {
            if (app.appKey === appKey) {
                forceUpdate(null);
            }
        });
    }, [appKey]);

    const loadAppAsync = useCallback(async () => {
        const app = appContainer.get(appKey);

        if (app && app.manifest && app.manifest.AppComponent) {
            return;
        }

        setIsFetching(true);

        const { data: manifest } = await apiClients.fusion.getAppManifestAsync(appKey);
        appContainer.updateManifest(appKey, manifest as AppManifest);

        await apiClients.fusion.loadAppScriptAsync(appKey);

        setIsFetching(false);
    }, [appKey]);

    useEffect(() => {
        loadAppAsync();
    }, [appKey]);

    const currentApp = appContainer.get(appKey);

    if (currentApp === null && isFetching) {
        return <div>Is fetching</div>;
    }

    if (currentApp === null) {
        return <div>Unable to find app</div>;
    }

    const AppComponent = currentApp.manifest.AppComponent;

    return <AppComponent />;
};

export default AppWrapper;
