import EventEmitter from 'eventemitter3';

export class DrawInstanceParameters
{
    /** number of vertices per instance */
    public vertexCount: number;
    /** number of indices per instance */
    public indexCount: number;
    /*
     * Whether WebGL or WebGPU instancing is used for attributes in this geometry.
     * If it is false, instancing can be emulated through setting vertex, index and float counts!
     */
    public instanced: boolean;
    /** Number of floats per instance in first vertex buffer of geometry. Can be calculated by geometry params */
    public strideFloats: number;

    constructor(options?: Partial<DrawInstanceParameters>)
    {
        this.vertexCount = options?.vertexCount ?? 0;
        this.indexCount = options?.indexCount ?? 0;
        this.instanced = options?.instanced ?? (this.vertexCount > 0 || this.indexCount > 0);
        this.strideFloats = options?.strideFloats ?? 0;
    }
}

export class MultiDrawBuffer extends EventEmitter<{
    update: MultiDrawBuffer
}>
{
    public offsets: Int32Array;
    public counts: Int32Array;
    public baseInstances: Uint32Array;
    public instanceCounts: Int32Array;
    public size: number;
    public count = 0;
    public params: DrawInstanceParameters = undefined;
    constructor(capacity = 64, params?: DrawInstanceParameters)
    {
        super();
        this.params = params;
        this.resize(capacity);
    }

    public ensureSize(sz: number)
    {
        if (sz <= this.size)
        {
            return;
        }
        let newSize = this.size;

        while (sz > newSize)
        {
            newSize *= 2;
        }
        this.resize(newSize);
    }

    public update()
    {
        this.emit('update');
    }

    public resize(sz: number, copyOldInfo = true)
    {
        const oldSize = this.size || 0;
        const oldCnt = this.counts; const oldOff = this.offsets;
        const oldInst = this.instanceCounts; const oldBaseInst = this.baseInstances;

        this.size = sz;

        this.counts = new Int32Array(sz);
        this.offsets = new Int32Array(sz);
        this.instanceCounts = new Int32Array(sz);
        this.baseInstances = new Uint32Array(sz);

        if (copyOldInfo && oldCnt)
        {
            this.counts.set(oldCnt, 0);
            this.offsets.set(oldOff, 0);
            this.instanceCounts.set(oldInst, 0);
            this.baseInstances.set(oldBaseInst, 0);
        }

        if (this.params)
        {
            for (let i = oldSize; i < sz; i++)
            {
                this.counts[i] = this.params.vertexCount;
            }
        }
    }

    public convertInstancesToVertices(params?: DrawInstanceParameters)
    {
        params = params || this.params;
        // converts instance counts to offsets & counts
        if (params.instanced)
        {
            return;
        }

        const { offsets, counts, baseInstances, instanceCounts, count } = this;

        if (params.indexCount > 0)
        {
            for (let j = 0; j < count; j++)
            {
                offsets[j] = baseInstances[j] * params.indexCount * 4;
                counts[j] = instanceCounts[j] * params.indexCount;
            }
        }
        else
        {
            for (let j = 0; j < count; j++)
            {
                offsets[j] = baseInstances[j] * params.vertexCount;
                counts[j] = instanceCounts[j] * params.vertexCount;
            }
        }
    }
}
