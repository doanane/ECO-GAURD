from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.pipeline_node import PipelineNode, NodeStatus

router = APIRouter()


def _node_to_dict(n: PipelineNode) -> dict:
    return {
        "id": n.id,
        "node_id": n.node_id,
        "label": n.label,
        "x_position": n.x_position,
        "y_position": n.y_position,
        "node_type": n.node_type.value,
        "status": n.status.value,
        "connected_to": n.connected_to or [],
        "sensor_id": n.sensor_id,
        "km_marker": n.km_marker,
    }


@router.get("/nodes")
def get_nodes(db: Session = Depends(get_db)):
    nodes = db.query(PipelineNode).order_by(PipelineNode.km_marker).all()
    return [_node_to_dict(n) for n in nodes]


@router.get("/topology")
def get_topology(db: Session = Depends(get_db)):
    nodes = db.query(PipelineNode).order_by(PipelineNode.km_marker).all()
    edges = []
    for n in nodes:
        for target_id in (n.connected_to or []):
            edges.append({"from": n.node_id, "to": target_id})
    return {
        "nodes": [_node_to_dict(n) for n in nodes],
        "edges": edges,
    }


@router.put("/nodes/{node_id}/status")
def update_node_status(node_id: str, status: str, db: Session = Depends(get_db)):
    node = db.query(PipelineNode).filter(PipelineNode.node_id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    try:
        node.status = NodeStatus(status.upper())
        db.commit()
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    return _node_to_dict(node)
