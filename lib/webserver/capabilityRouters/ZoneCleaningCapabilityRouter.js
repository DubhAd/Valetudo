const CapabilityRouter = require("./CapabilityRouter");
const Logger = require("../../Logger");

const ValetudoZone = require("../../entities/core/ValetudoZone");
const ValetudoZonePreset = require("../../entities/core/ValetudoZonePreset");

class ZoneCleaningCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        /**
         * @swagger
         * /api/v2/robot/capabilities/ZoneCleaningCapability/presets:
         *   get:
         *     tags:
         *       - ZoneCleaningCapability
         *     summary: Get available zone presets
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               additionalProperties:
         *                 $ref: "#/components/schemas/ValetudoZonePreset"
         */
        this.router.get("/presets", (req, res) => {
            res.json(this.capability.robot.config.get("zonePresets"));
        });


        /**
         * @swagger
         * /api/v2/robot/capabilities/ZoneCleaningCapability/presets:
         *   put:
         *     tags:
         *       - ZoneCleaningCapability
         *     summary: Clean one or more zone presets
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               action:
         *                 type: string
         *                 enum:
         *                   - clean
         *               ids:
         *                 type: array
         *                 description: "IDs of zones to clean"
         *                 items:
         *                   type: string
         *     responses:
         *       200:
         *          $ref: "#/components/responses/200"
         *       400:
         *          $ref: "#/components/responses/400"
         *       404:
         *          description: "One or more specified zone preset IDs were not found"
         */
        this.router.put("/presets", async (req, res) => {
            if (req.body && req.body.action === "clean" && Array.isArray(req.body.ids)) {
                const loadedZones = [];

                if (Array.isArray(req.body.ids) && req.body.ids.length > 0) {
                    const allValid = req.body.ids.every(zone_id => {
                        const zoneFromConfig = this.capability.robot.config.get("zonePresets")[zone_id];

                        if (zoneFromConfig) {
                            loadedZones.push(zoneFromConfig);

                            return true;
                        } else {
                            return false;
                        }
                    });

                    if (allValid) {
                        try {
                            await this.capability.start(loadedZones.reduce((acc, curr) => {
                                return acc.concat(curr.zones);
                            }, []));
                            res.sendStatus(200);
                        } catch (e) {
                            Logger.warn("Error while starting zone cleaning for multiple presets", e);
                            res.status(500).json(e.message);
                        }
                    } else {
                        res.sendStatus(400);
                    }
                }
            } else {
                res.sendStatus(404);
            }
        });

        /**
         * @swagger
         * /api/v2/robot/capabilities/ZoneCleaningCapability/presets/{id}:
         *   get:
         *     tags:
         *       - ZoneCleaningCapability
         *     summary: Get zone preset by ID
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: "Preset UUID"
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           application/json:
         *             schema:
         *               $ref: "#/components/schemas/ValetudoZonePreset"
         *       404:
         *          description: "One or more specified zone preset IDs were not found"
         */
        this.router.get("/presets/:id", (req, res) => {
            const zone = this.capability.robot.config.get("zonePresets")[req.params.id];

            if (zone) {
                res.json(zone);
            } else {
                res.sendStatus(404);
            }
        });

        /**
         * @swagger
         * /api/v2/robot/capabilities/ZoneCleaningCapability/presets/{id}:
         *   put:
         *     tags:
         *       - ZoneCleaningCapability
         *     summary: Clean zone preset by ID
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               action:
         *                 type: string
         *                 enum:
         *                   - clean
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: "Preset UUID"
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *          $ref: "#/components/responses/200"
         *       404:
         *          description: "The specified zone preset IDs was not found"
         */
        this.router.put("/presets/:id", async (req, res) => {
            const zone = this.capability.robot.config.get("zonePresets")[req.params.id];

            if (zone && req.body && req.body.action === "clean") {
                try {
                    await this.capability.start(zone.zones);
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while starting zone cleaning for preset " + req.params.id, e);
                    res.status(500).json(e.message);
                }
            } else {
                res.sendStatus(404);
            }
        });

        /**
         * @swagger
         * /api/v2/robot/capabilities/ZoneCleaningCapability/presets/{id}:
         *   delete:
         *     tags:
         *       - ZoneCleaningCapability
         *     summary: Delete zone preset by ID
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: "Preset UUID"
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *          $ref: "#/components/responses/200"
         *       404:
         *          description: "The specified zone preset IDs was not found"
         */
        this.router.delete("/presets/:id", (req, res) => {
            const zoneSettings = this.capability.robot.config.get("zonePresets");

            if (zoneSettings[req.params.id]) {
                delete (zoneSettings[req.params.id]);

                this.capability.robot.config.set("zonePresets", zoneSettings);

                res.sendStatus(200);
            } else {
                res.sendStatus(404);
            }
        });

        /**
         * @swagger
         * /api/v2/robot/capabilities/ZoneCleaningCapability/presets:
         *   post:
         *     tags:
         *       - ZoneCleaningCapability
         *     summary: Add new preset
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             $ref: "#/components/schemas/ValetudoZonePreset"
         *     responses:
         *       201:
         *         $ref: "#/components/responses/201"
         *       400:
         *         $ref: "#/components/responses/400"
         */
        this.router.post("/presets", (req, res) => {
            if (req.body && req.body.name && Array.isArray(req.body.zones) && req.body.zones.length > 0) {
                try {
                    const zoneSettings = this.capability.robot.config.get("zonePresets");
                    const newPreset = new ValetudoZonePreset({
                        name: req.body.name,
                        id: req.body.id,
                        zones: req.body.zones.map(z => {
                            return new ValetudoZone({
                                points: z.points,
                                iterations: z.iterations
                            });
                        })
                    });

                    zoneSettings[newPreset.id] = newPreset;

                    this.capability.robot.config.set("zonePresets", zoneSettings);
                    res.sendStatus(201);
                } catch (e) {
                    Logger.warn("Error while saving new zone", req.body);
                    res.status(500).json(e.message);
                }

            } else {
                res.sendStatus(400);
            }
        });

        //TODO: Remove this after building a new webinterface

        this.router.get("/presets_legacy", (req, res) => {
            const presetsFromConfig = Object.values(this.capability.robot.config.get("zonePresets"));

            res.json(presetsFromConfig.map(preset => {
                return {
                    name: preset.name,
                    id: preset.id,
                    areas: preset.zones.map(zone => {
                        return [
                            zone.points.pA.x,
                            zone.points.pA.y,
                            zone.points.pC.x,
                            zone.points.pC.y,
                            zone.iterations
                        ];
                    })
                };
            }));
        });


        this.router.post("/presets_legacy", (req, res) => {
            if (Array.isArray(req.body)) {
                const valid = req.body.every(z => z && z.name && Array.isArray(z.areas));

                if (valid) {
                    const zonePresetsArr = req.body.map(preset => {
                        return new ValetudoZonePreset({
                            name: preset.name,
                            id: preset.id,
                            zones: preset.areas.map(zone => {
                                return new ValetudoZone({
                                    points: {
                                        pA: {
                                            x: zone[0],
                                            y: zone[1]
                                        },
                                        pB: {
                                            x: zone[2],
                                            y: zone[1]
                                        },
                                        pC: {
                                            x: zone[2],
                                            y: zone[3]
                                        },
                                        pD: {
                                            x: zone[0],
                                            y: zone[3]
                                        },
                                    },
                                    iterations: zone[4]
                                });
                            })
                        });
                    });
                    const zonePresets = {};

                    zonePresetsArr.forEach(z => {
                        zonePresets[z.id] = z;
                    });



                    this.capability.robot.config.set("zonePresets", zonePresets);
                    res.sendStatus(201);
                } else {
                    res.sendStatus(400);
                }
            }
        });

        /**
         * @swagger
         * /api/v2/robot/capabilities/ZoneCleaningCapability/presets/{id}:
         *   post:
         *     tags:
         *       - ZoneCleaningCapability
         *     summary: Edit existing preset by ID
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: "Preset UUID"
         *         schema:
         *           type: string
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             $ref: "#/components/schemas/ValetudoZonePreset"
         *     responses:
         *       201:
         *         $ref: "#/components/responses/201"
         *       400:
         *         $ref: "#/components/responses/400"
         *       404:
         *         description: "The specified zone ID does not exist."
         */
        this.router.post("/presets/:id", (req, res) => {
            const zoneSettings = this.capability.robot.config.get("zonePresets");

            if (zoneSettings[req.params.id]) {

                if (req.body && req.body.name && Array.isArray(req.body.zones) && req.body.zones.length > 0) {
                    try {
                        const newPreset = new ValetudoZonePreset({
                            name: req.body.name,
                            id: req.params.id,
                            zones: req.body.zones.map(z => {
                                return new ValetudoZone({
                                    points: z.points,
                                    iterations: z.iterations
                                });
                            })
                        });

                        zoneSettings[newPreset.id] = newPreset;

                        this.capability.robot.config.set("zonePresets", zoneSettings);
                        res.sendStatus(200);
                    } catch (e) {
                        Logger.warn("Error while saving new zone", req.body);
                        res.status(500).json(e.message);
                    }
                }
            } else {
                res.sendStatus(404);
            }
        });

        /**
         * @swagger
         * /api/v2/robot/capabilities/ZoneCleaningCapability/:
         *   put:
         *     tags:
         *       - ZoneCleaningCapability
         *     summary: Clean one or more zones
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               action:
         *                 type: string
         *                 enum:
         *                   - clean
         *               zones:
         *                 type: array
         *                 description: "Zones clean"
         *                 items:
         *                   $ref: "#/components/schemas/ValetudoZone"
         *     responses:
         *       200:
         *          $ref: "#/components/responses/200"
         *       400:
         *          $ref: "#/components/responses/400"
         */
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                if (req.body.action === "clean" && Array.isArray(req.body.zones)) {
                    try {
                        await this.capability.start(req.body.zones.map(z => {
                            if (!(z.points)) { //More validation would be nice
                                throw new Error("Invalid Zone");
                            }

                            return new ValetudoZone({
                                points: z.points,
                                iterations: z.iterations
                            });
                        }));
                        res.sendStatus(200);

                    } catch (e) {
                        Logger.warn("Error while starting zone cleaning", {
                            body: req.body,
                            e: e
                        });
                        res.status(500).json(e.message);
                    }
                } else {
                    res.status(400).send("Invalid action \"" + req.body.action + "\" in request body");
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = ZoneCleaningCapabilityRouter;
