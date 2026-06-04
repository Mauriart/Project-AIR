const express = require('express');
const router = express.Router();

const ComisionModel = require('../models/ComisionModel');


// POST /comisiones
router.post('/', async (req, res) => {

  const { nombre, descripcion } = req.body;

  if (!nombre) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El nombre de la comisión es requerido'
    });
  }
  

  try {

    const comision = await ComisionModel.crearComision(
      nombre,
      descripcion
    );

    return res.status(201).json({
      ok: true,
      comision
    });

  } catch (error) {

    console.error('Error creando comisión:', error);

    return res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor'
    });
  }
});

router.get('/:id/integrantes', async (req, res) => {

    try {

        const integrantes =
            await ComisionModel.obtenerIntegrantes(
                req.params.id
            );

        res.json(integrantes);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Error obteniendo integrantes'
        });
    }
});



// GET /comisiones
router.get('/', async (req, res) => {

  try {

    const comisiones =
      await ComisionModel.listarComisiones();

    return res.status(200).json({
      ok: true,
      comisiones
    });

  } catch (error) {

    console.error('Error obteniendo comisiones:', error);

    return res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor'
    });
  }
});


// POST /comisiones/integrantes
router.post('/integrantes', async (req, res) => {

  const {
    id_comision,
    asambleista_id,
    rol,
    fecha_inicio,
    fecha_fin
  } = req.body;

  try {

    const integrante =
      await ComisionModel.agregarIntegrante(
        id_comision,
        asambleista_id,
        rol,
        fecha_inicio,
        fecha_fin
      );

    return res.status(201).json({
      ok: true,
      integrante
    });

  } catch (error) {

    console.error('Error agregando integrante:', error);

    return res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor'
    });
  }
});


// POST /comisiones/asistencia
router.post('/asistencia', async (req, res) => {

  const {
    id_sesion,
    asambleista_id,
    estado_asistencia
  } = req.body;

  try {

    const asistencia =
      await ComisionModel.registrarAsistencia(
        id_sesion,
        asambleista_id,
        estado_asistencia
      );

    return res.status(201).json({
      ok: true,
      asistencia
    });

  } catch (error) {

    console.error('Error registrando asistencia:', error);

    return res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor'
    });
  }
});

router.delete('/:id', async (req, res) => {

    try {

        await ComisionModel.eliminarComision(
            req.params.id
        );

        res.json({
            ok: true,
            mensaje: 'Comisión eliminada'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error eliminando comisión'
        });
    }
});

router.delete('/integrantes/:id', async (req, res) => {

    try {

        await ComisionModel.eliminarIntegrante(
            req.params.id
        );

        res.json({
            ok: true
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error eliminando integrante'
        });
    }

});

router.put('/integrantes/:id', async (req, res) => {

    const {
        rol,
        estado,
        fecha_fin
    } = req.body;

    try {

        const integrante =
            await ComisionModel.actualizarIntegrante(
                req.params.id,
                rol,
                estado,
                fecha_fin
            );

        res.json({
            ok: true,
            integrante
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error actualizando integrante'
        });

    }

});

module.exports = router;