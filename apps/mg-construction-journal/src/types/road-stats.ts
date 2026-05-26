export interface RoadStats {
    entryCount: number;
    statusDistribution: {
        workDone: number;
        workInProgress: number;
        workStopped: number;
    };
    totalVolume: number;
}
